#!/usr/bin/env python3
# Script completo di migrazione dati per Soci Sant'Antoniari
# Combina tutte le funzionalità: migrazione, verifica duplicati, analisi e uniformazione stile

import sqlite3
import pandas as pd
import sys
import re
from datetime import datetime

DB_FILE = "santantoniari.sqlite"
CSV_FILES = ["maggiorenni.csv", "minorenni.csv", "maggiorenni_nuovi.csv", "minorenni_nuovi.csv"]

def setup_database():
    """Crea il database e le tabelle se non esistono"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Tabella per informazioni personali dei soci
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Soci (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cognome TEXT,
        nome TEXT,
        luogo_nascita TEXT,
        data_nascita TEXT,
        gruppo_appartenenza TEXT,
        data_prima_iscrizione INTEGER,
        note TEXT,
        originale_id INTEGER,
        file_origine TEXT
    )''')

    # Tabella per pagamenti annuali delle quote
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Tesseramenti (
        id_tesseramento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_socio INTEGER,
        anno INTEGER,
        data_pagamento TEXT,
        quota_pagata REAL,
        numero_ricevuta INTEGER,
        numero_blocchetto INTEGER,
        FOREIGN KEY (id_socio) REFERENCES Soci (id)
    )''')

    conn.commit()
    conn.close()
    print("Database setup completato. Tabelle 'Soci' e 'Tesseramenti' pronte.")

def parse_socio_name(name_str):
    """Divide una stringa 'COGNOME Nome' in (cognome, nome)"""
    if not isinstance(name_str, str):
        return "", ""
    parts = name_str.strip().split()
    if len(parts) <= 1:
        return name_str.strip(), ""
    # Assume che l'ultima parte sia il nome, tutto il resto è il cognome
    cognome = " ".join(parts[:-1])
    nome = parts[-1]
    return cognome, nome

def format_date(date_input):
    """Prova a formattare varie formati di data in YYYY-MM-DD"""
    if pd.isna(date_input):
        return None
    if isinstance(date_input, datetime):
        return date_input.strftime('%Y-%m-%d')
    try:
        # Gestisce formati come '29/08/1994' o '29/08/94'
        return pd.to_datetime(date_input, dayfirst=True, errors='coerce').strftime('%Y-%m-%d')
    except (ValueError, TypeError, AttributeError):
        return str(date_input) # Mantiene originale se il parsing fallisce

def process_file(csv_path):
    """Legge un file CSV e popola il database"""
    print(f"\n--- Elaborazione file: {csv_path} ---")
    try:
        # Prova a leggere con UTF-8 standard, fallback a latin-1 per file più vecchi
        try:
            df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
        except UnicodeDecodeError:
            print("Decodifica UTF-8 fallita, provo con codifica 'latin-1'...")
            df = pd.read_csv(csv_path, dtype=str, encoding='latin-1', keep_default_na=False)

    except FileNotFoundError:
        print(f"ERRORE: File non trovato in '{csv_path}'. Controlla il percorso.")
        return
    except Exception as e:
        print(f"Errore durante la lettura del CSV: {e}")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Identifica colonne anno basate su pattern come '2023'
    year_columns = [col for col in df.columns if re.match(r'^\d{4}$', col)]
    if not year_columns:
        print("Attenzione: Nessuna colonna anno trovata in questo file.")

    processed_count = 0
    skipped_count = 0
    for row_idx, (index, row) in enumerate(df.iterrows(), start=2):
        notes = []
        
        # --- 1. Elabora Informazioni Socio ---
        socio_id_raw = row.get('n°', '')
        if not str(socio_id_raw).strip():
            print(f"Salto riga {row_idx} per 'n°' mancante.")
            skipped_count += 1
            continue
        try:
            originale_id = int(float(socio_id_raw))
        except (ValueError, TypeError):
            print(f"Salto riga {row_idx} per 'n°' non valido: {socio_id_raw}")
            skipped_count += 1
            continue

        cognome, nome = parse_socio_name(row.get('SOCIO'))
        if not cognome and not nome:
            print(f"Salto riga {row_idx} (ID originale: {originale_id}) per campo SOCIO vuoto.")
            skipped_count += 1
            continue
        
        data_nascita = format_date(row.get('DATA'))
        if not data_nascita or 'NaT' in data_nascita:
            notes.append("ATTENZIONE: Data di nascita mancante o non valida.")

        luogo_nascita = row.get('LUOGO')
        gruppo = row.get('REFER.')
        note_originali = row.get('NOTE')
        if pd.notna(note_originali) and str(note_originali).strip():
            notes.append(str(note_originali).strip())

        # Controlla se il socio esiste già basandosi su nome e data di nascita
        cursor.execute("""
        SELECT id FROM Soci 
        WHERE cognome = ? AND nome = ? AND data_nascita = ?
        """, (cognome, nome, data_nascita))
        
        existing_socio = cursor.fetchone()
        
        if existing_socio is None:
            # Inserisce nuovo socio
            cursor.execute('''
            INSERT INTO Soci (cognome, nome, luogo_nascita, data_nascita, 
                             gruppo_appartenenza, note, originale_id, file_origine)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (cognome, nome, luogo_nascita, data_nascita, gruppo, 
                  ", ".join(notes), originale_id, csv_path))
            
            # Ottiene il nuovo ID socio
            socio_id = cursor.lastrowid
        else:
            # Usa ID socio esistente
            socio_id = existing_socio[0]
            print(f"Socio già esistente: {cognome} {nome} (nato il {data_nascita})")
        
        # --- 2. Elabora Tesseramenti (Pagamenti) per ogni anno ---
        for year_str in year_columns:
            year_col_index = df.columns.get_loc(year_str)

            # --- CONTROLLO ROBUSTEZZA ---
            # Verifica che ci siano abbastanza colonne per contenere i dati di pagamento per questo anno.
            # Servono 4 colonne dopo la colonna anno per: ricevuta, blocchetto, data, quota.
            if year_col_index + 4 >= len(df.columns):
                continue # Salta questo anno per questo utente, il file non ha abbastanza colonne.
            
            # Se il controllo passa, possiamo accedere alle colonne in sicurezza
            try:
                quota_col_name = df.columns[year_col_index + 4]
                quota_val = row.get(quota_col_name)

                if quota_val and str(quota_val).strip() != '':
                    anno = int(year_str)
                    
                    # Ottieni altri dettagli di pagamento in sicurezza
                    ricevuta_raw = row.get(df.columns[year_col_index + 1], '0')
                    blocchetto_raw = row.get(df.columns[year_col_index + 2], '0')
                    data_pag_raw = row.get(df.columns[year_col_index + 3])
                    
                    # Converti in numeri, default a 0 in caso di fallimento
                    quota = float(str(quota_val).replace(',', '.'))
                    ricevuta = int(float(str(ricevuta_raw).strip() or '0'))
                    blocchetto = int(float(str(blocchetto_raw).strip() or '0'))
                    data_pagamento = format_date(data_pag_raw)

                    # Evita di inserire pagamenti duplicati
                    cursor.execute("""
                    SELECT id_tesseramento FROM Tesseramenti 
                    WHERE id_socio = ? AND anno = ? AND quota_pagata = ?
                    """, (socio_id, anno, quota))
                    
                    if cursor.fetchone() is None:
                        cursor.execute('''
                        INSERT INTO Tesseramenti (id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ''', (socio_id, anno, data_pagamento, quota, ricevuta, blocchetto))
            except (ValueError, TypeError) as e:
                # Questo cattura errori se i dati dentro una cella sono malformati (es. testo in campo numerico)
                pass
        
        processed_count += 1

    conn.commit()
    conn.close()
    print(f"Elaborazione completata per {csv_path}. Elaborate {processed_count} righe, saltate {skipped_count} righe.")

def normalizza_nome(nome):
    """Normalizza il nome secondo le regole stabilite"""
    if not nome:
        return nome
    # Gestisce casi particolari come D'Angelo, De Santis, etc.
    parti = re.split(r'\s+', nome.strip())
    parti_normalizzate = []
    
    for parte in parti:
        if '-' in parte:
            # Gestisce nomi composti come Maria-Rosa
            sottoparti = parte.split('-')
            sottoparti_normalizzate = [p.capitalize() for p in sottoparti]
            parti_normalizzate.append('-'.join(sottoparti_normalizzate))
        elif parte.lower().startswith(('de ', 'di ', 'da ', 'del ', 'della ', 'dell\'', 'd\'')):
            # Gestisce prefissi come De Santis, Di Marco, etc.
            parti_normalizzate.append(parte.lower())
        else:
            parti_normalizzate.append(parte.capitalize())
    
    return ' '.join(parti_normalizzate)

def uniforma_stile_nomi():
    """Uniforma lo stile dei nomi (prima lettera maiuscola, resto minuscolo)"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Ottieni tutti i soci con nomi da normalizzare
    cursor.execute('SELECT id, cognome, nome FROM soci')
    soci = cursor.fetchall()
    
    modifiche = 0
    for id_socio, cognome, nome in soci:
        cognome_normalizzato = normalizza_nome(cognome)
        nome_normalizzato = normalizza_nome(nome)
        
        if cognome != cognome_normalizzato or nome != nome_normalizzato:
            cursor.execute('''
                UPDATE soci 
                SET cognome = ?, nome = ?
                WHERE id = ?
            ''', (cognome_normalizzato, nome_normalizzato, id_socio))
            modifiche += 1
    
    conn.commit()
    conn.close()
    
    print(f"\n=== UNIFORMAZIONE STILE NOMI ===")
    print(f"Nomi normalizzati: {modifiche}")
    print("Tutti i nomi sono stati uniformati allo stile 'Maiuscolo Iniziale'")
    
    return modifiche

def analizza_duplicati():
    """Analizza duplicati basati su nome, cognome e data di nascita"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print("\n=== ANALISI DETTAGLIATA DUPLICATI ===")
    
    # 1. Duplicati per ID originale
    cursor.execute('''
    SELECT originale_id, COUNT(*) as conteggio
    FROM Soci 
    GROUP BY originale_id 
    HAVING COUNT(*) > 1
    ORDER BY conteggio DESC, originale_id
    ''')
    
    duplicati_id = cursor.fetchall()
    print(f"\n1. DUPLICATI PER ID ORIGINALE: {len(duplicati_id)} casi")
    print("-" * 50)
    for originale_id, conteggio in duplicati_id:
        cursor.execute('''
        SELECT id, cognome, nome, data_nascita, file_origine
        FROM Soci 
        WHERE originale_id = ?
        ORDER BY id
        ''', (originale_id,))
        
        soci = cursor.fetchall()
        print(f"\nID originale {originale_id} ({conteggio} occorrenze):")
        for socio in soci:
            print(f"  ID DB: {socio[0]}, {socio[1]} {socio[2]} (nato il {socio[3]}) - da: {socio[4]}")
    
    # 2. Duplicati per nome completo (cognome + nome + data nascita)
    cursor.execute('''
    SELECT cognome, nome, data_nascita, COUNT(*) as conteggio,
           GROUP_CONCAT(id || ' (' || file_origine || ')') as occorrenze
    FROM soci
    GROUP BY cognome, nome, data_nascita
    HAVING COUNT(*) > 1
    ORDER BY conteggio DESC
    ''')
    
    duplicati_nome = cursor.fetchall()
    
    print(f"\n2. DUPLICATI PER NOME COMPLETO: {len(duplicati_nome)} casi")
    print("-" * 50)
    
    if duplicati_nome:
        for cognome, nome, data_nascita, conteggio, occorrenze in duplicati_nome:
            print(f"{cognome} {nome} (nato il {data_nascita}) - {conteggio} occorrenze:")
            for occorrenza in occorrenze.split(','):
                print(f"  ID DB: {occorrenza}")
            print()
    else:
        print("Nessun duplicato trovato per nome completo")
    
    # 3. Analisi stile dei dati (maiuscole/minuscole)
    print(f"\n\n3. ANALISI STILE DEI DATI")
    print("-" * 50)
    
    # Conta soci con nomi in minuscolo
    cursor.execute('''
    SELECT COUNT(*) 
    FROM Soci 
    WHERE cognome = LOWER(cognome) 
       OR nome = LOWER(nome)
    ''')
    minuscoli = cursor.fetchone()[0]
    
    # Conta soci con nomi in maiuscolo
    cursor.execute('''
    SELECT COUNT(*) 
    FROM Soci 
    WHERE cognome = UPPER(cognome) 
       OR nome = UPPER(nome)
    ''')
    maiuscoli = cursor.fetchone()[0]
    
    # Conta soci con stile misto
    cursor.execute('''
    SELECT COUNT(*) 
    FROM Soci 
    WHERE (cognome != LOWER(cognome) 
           AND cognome != UPPER(cognome))
       OR (nome != LOWER(nome) 
           AND nome != UPPER(nome))
    ''')
    misti = cursor.fetchone()[0]
    
    print(f"Soci con nomi in minuscolo: {minuscoli}")
    print(f"Soci con nomi in maiuscolo: {maiuscoli}")
    print(f"Soci con stile misto: {misti}")
    
    # Esempi di stili diversi
    print(f"\nEsempi di stili diversi:")
    cursor.execute('''
    SELECT id, cognome, nome, file_origine 
    FROM Soci 
    WHERE cognome = LOWER(cognome) 
       OR nome = LOWER(nome)
    LIMIT 5
    ''')
    
    print("\nEsempi minuscolo:")
    for row in cursor.fetchall():
        print(f"  ID {row[0]}: {row[1]} {row[2]} - da: {row[3]}")
    
    cursor.execute('''
    SELECT id, cognome, nome, file_origine 
    FROM Soci 
    WHERE cognome = UPPER(cognome) 
       OR nome = UPPER(nome)
    LIMIT 5
    ''')
    
    print("\nEsempi maiuscolo:")
    for row in cursor.fetchall():
        print(f"  ID {row[0]}: {row[1]} {row[2]} - da: {row[3]}")
    
    # 4. Riepilogo generale
    cursor.execute('SELECT COUNT(*) FROM Soci')
    total_soci = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM Tesseramenti')
    total_tesseramenti = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(DISTINCT file_origine) FROM Soci')
    file_count = cursor.fetchone()[0]
    
    print(f"\n\n4. RIEPILOGO GENERALE")
    print("-" * 50)
    print(f"Soci totali: {total_soci}")
    print(f"Tesseramenti totali: {total_tesseramenti}")
    print(f"File CSV processati: {file_count}")
    print(f"Duplicati per ID originale: {len(duplicati_id)}")
    print(f"Duplicati per nome completo: {len(duplicati_nome)}")
    
    conn.close()

def pulisci_database():
    """Pulisce completamente il database per ricrearlo da zero"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('DROP TABLE IF EXISTS Tesseramenti')
    cursor.execute('DROP TABLE IF EXISTS Soci')
    
    conn.commit()
    conn.close()
    print("Database pulito completamente.")

def main():
    """Funzione principale che gestisce tutto il processo"""
    print("=== MIGRAZIONE COMPLETA DATI SANT'ANTONIARI ===")
    print("Questo script esegue tutte le operazioni in sequenza:")
    print("1. Pulisce il database esistente")
    print("2. Migra tutti i file CSV")
    print("3. Analizza i duplicati")
    print("4. Uniforma lo stile dei nomi")
    print("5. Mostra il riepilogo finale")
    print()
    
    # Pulisci il database
    pulisci_database()
    
    # Setup database
    setup_database()
    
    # Processa tutti i file CSV
    for csv_file in CSV_FILES:
        process_file(csv_file)
    
    # Analizza duplicati
    analizza_duplicati()
    
    # Uniforma stile nomi
    uniforma_stile_nomi()
    
    # Analisi finale
    analizza_duplicati()
    
    print("\n✅ MIGRAZIONE COMPLETATA CON SUCCESSO!")
    print("Il database 'santantoniari.sqlite' è pronto per l'uso.")

if __name__ == "__main__":
    main()