# Glossario

Una parola per ogni concetto, la stessa in ogni schermata, nei PDF e nei messaggi. Le etichette hanno solo la prima lettera maiuscola ("Nuovo socio", non "Nuovo Socio"). I nomi dei campi e i codici salvati (`gruppo_appartenenza`, `regolarizza`, V/X/O) non si mostrano mai come testo: si mostra la parola di questa tabella.

Le regole che stanno dietro le parole vivono nel codice: `src/utils/payment.js` (eta', esenzione, arretrati, iscrizione), `src/utils/voto.js` (diritto di voto), `src/utils/statistiche.js` (iscritti, nuovi, rientri, non rinnovati), `src/utils/blocchetto.js` (blocchetti e ricevute). Se il glossario e il codice non dicono la stessa cosa, e' un difetto da segnalare.

## Termini

| Termine       | Significato                                                                                                                                                                                                                       | Da non usare                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Socio         | Persona registrata nell'archivio, con la sua anagrafica. Puo' essere iscritto in un anno o no.                                                                                                                                    | Membro, utente, iscritto (quando si parla della persona e non dell'anno) |
| Manicchia     | Il gruppo a cui il socio appartiene (campo `gruppo_appartenenza`). Facoltativa: se manca si scrive "Senza manicchia".                                                                                                             | Gruppo, squadra, "Non specificato"                                       |
| Blocchetto    | Blocco di ricevute cartacee numerate in modo progressivo, affidato a un incaricato. Ogni blocchetto ha tante ricevute quante dice l'impostazione "Ricevute per blocchetto" (oggi 10: il blocchetto 2 contiene le ricevute 11-20). | Libretto, carnet                                                         |
| Ricevuta      | Il foglio del blocchetto dato al socio quando paga. Ogni pagamento registrato porta il numero di ricevuta e il blocchetto.                                                                                                        | Scontrino, bolletta                                                      |
| Iscritto      | Socio in regola in un anno: ha pagato, oppure e' minorenne ed esente, dall'anno di iscrizione in poi. Si dice sempre di un anno ("iscritti nel 2026").                                                                            | Attivo, tesserato                                                        |
| Nuovo         | Socio al primo anno di iscrizione (il primo tra l'anno dichiarato e il primo pagamento). Paga la quota dei nuovi (impostazione "Quota Nuovi Soci Default", oggi 25 EUR) e quell'anno non vota.                                    | Neo-iscritto, new                                                        |
| Rientro       | Socio di nuovo in regola dopo almeno un anno fuori. Da maggiorenne paga la quota dei nuovi.                                                                                                                                       | Ritorno; "rientrato" per un blocchetto o per chi era da reiscrivere      |
| Non rinnovato | Iscritto l'anno prima ma non in questo. Nell'anno in corso il numero scende man mano che si registrano i pagamenti.                                                                                                               | Perso, decaduto, cessato                                                 |
| Regolarizza   | Stato del diritto di voto: il socio ha quote mancanti negli ultimi tre anni ma un anno in regola nella finestra; pagando le quote mancanti puo' votare. Gli altri due stati sono "Si'" e "No".                                    | Sanare, mettersi in pari                                                 |

Parole collegate, usate nelle stesse schermate:

| Termine        | Significato                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Quota          | L'importo pagato per un anno. Stato della quota: Pagata (V), Da pagare (X), Esente (O), Non iscritto (-).                               |
| Esente         | Minorenne nell'anno, dopo l'iscrizione: non paga e conta come in regola. L'eta' si decide dal solo anno di nascita, non dal compleanno. |
| Arretrati      | Anni da pagare dopo l'ultimo anno in regola, al massimo 3.                                                                              |
| Da reiscrivere | Piu' di 3 anni di fila senza pagare: nessun arretrato, il socio si iscrive di nuovo e quell'anno conta come primo anno.                 |
| Reiscritto     | Socio che era da reiscrivere e si e' iscritto di nuovo. L'anno della reiscrizione non vota.                                             |
| Restituito     | Blocchetto consegnato in segreteria dall'incaricato.                                                                                    |

## Decisioni

- **Rientro, Reiscritto, Restituito** (deciso il 31 ottobre 2026). Rientro si dice solo del socio di nuovo in regola dopo almeno un anno fuori. Il socio che era da reiscrivere e torna e' "Reiscritto". Il blocchetto consegnato in segreteria e' "Restituito", come il concetto `restituisci` delle icone. I codici salvati (lo stato `rientrato` dei blocchetti) restano: cambiano solo i testi mostrati.
