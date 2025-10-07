# generate_mock_data.py
#
# Questo script crea un database 'santantoniari.sqlite' pulito
# e lo popola con dati di test (mock data) finti e non sensibili.
# È pensato per essere dato allo sviluppatore per permettergli di
# lavorare sull'applicazione senza avere accesso ai dati reali.

import sqlite3
import os

DB_FILE = "santantoniari_test.sqlite"

def create_mock_database():
    """Creates and populates a mock database for development."""
    # Delete the old test database if it exists
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"Removed old test database '{DB_FILE}'.")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    print(f"Created new test database '{DB_FILE}'.")

    # --- Create tables based on the schema ---
    cursor.execute('''
    CREATE TABLE Soci (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cognome TEXT, nome TEXT, luogo_nascita TEXT, data_nascita TEXT,
        gruppo_appartenenza TEXT, data_prima_iscrizione INTEGER, note TEXT,
        originale_id INTEGER, file_origine TEXT
    )''')

    cursor.execute('''
    CREATE TABLE Tesseramenti (
        id_tesseramento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_socio INTEGER, anno INTEGER, data_pagamento TEXT,
        quota_pagata REAL, numero_ricevuta INTEGER, numero_blocchetto INTEGER,
        FOREIGN KEY (id_socio) REFERENCES Soci (id)
    )''')
    print("Tables 'Soci' and 'Tesseramenti' created successfully.")

    # --- Populate with mock data ---
    soci_finti = [
        (1, 'Rossi', 'Mario', 'Gubbio', '1980-05-15', 'INTERNA', 2010, '', 1, 'mock.csv'),
        (2, 'Verdi', 'Giulia', 'Perugia', '1992-11-20', 'PADULE', 2015, 'Referente: Famiglia Rossi', 2, 'mock.csv'),
        (3, 'Bianchi', 'Luca', 'Gubbio', '2008-02-10', 'MADONNA DEL PONTE', 2022, 'Minorenne', 3, 'mock.csv'),
        (4, 'Gialli', 'Anna', 'Gubbio', '1975-09-01', 'INTERNA', 2010, '', 4, 'mock.csv'),
        (5, 'Neri', 'Paolo', 'Branca', '2012-07-30', 'BRANCA', 2023, 'Minorenne', 5, 'mock.csv')
    ]

    tesseramenti_finti = [
        # Pagamenti per Mario Rossi (id_socio=1)
        (1, 2022, '2022-01-10', 10.0, 101, 300),
        (1, 2023, '2023-01-12', 10.0, 205, 301),
        (1, 2025, '2025-01-08', 10.0, 450, 305),
        # Pagamenti per Giulia Verdi (id_socio=2) - ha un buco nel 2024
        (2, 2023, '2023-01-15', 10.0, 210, 301),
        (2, 2025, '2025-01-09', 10.0, 451, 305),
        # Pagamenti per Luca Bianchi (id_socio=3)
        (3, 2023, '2023-01-20', 5.0, 230, 302),
        (3, 2024, '2024-01-18', 5.0, 380, 304),
        # Pagamenti per Anna Gialli (id_socio=4)
        (4, 2024, '2024-01-18', 10.0, 381, 304),
    ]

    cursor.executemany('''
    INSERT INTO Soci (id, cognome, nome, luogo_nascita, data_nascita, gruppo_appartenenza, data_prima_iscrizione, note, originale_id, file_origine)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', soci_finti)

    cursor.executemany('''
    INSERT INTO Tesseramenti (id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', tesseramenti_finti)

    conn.commit()
    conn.close()
    print(f"{len(soci_finti)} mock members and {len(tesseramenti_finti)} mock payments inserted.")
    print("Mock database is ready for development.")

if __name__ == "__main__":
    create_mock_database()
# --- End of generate_mock_data.py ---