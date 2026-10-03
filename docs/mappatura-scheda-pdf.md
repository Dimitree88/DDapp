# Mappatura del modello `scheda.pdf`

La tabella modificabile è [mappatura-scheda-pdf.csv](mappatura-scheda-pdf.csv). Contiene tutte le 410 caselle del PDF (120 a pagina 1, 290 a pagina 2), una riga per casella. Si può aprire in Excel o LibreOffice e filtrare per `sezione` o `stato`.

| Colonna | Significato |
| --- | --- |
| `etichetta_pdf` | Nome leggibile della casella; nelle righe ripetute include il numero della riga. |
| `casella_pdf` | Nome tecnico presente nel modulo, da usare per compilare il PDF. |
| `dato_app` | Origine proposta nel modello `Sheet`; `name` è il nome del personaggio, separato da `Sheet`. |
| `stato` | `associato`: corrispondenza definita; `dato_mancante`: l'app non memorizza quel valore e la casella resta vuota. |
| `nota` | Limiti di spazio o trasformazioni da definire. |
| `decisione_utente`, `nota_utente` | Colonne libere per confermare, correggere o lasciare vuota una casella. |
| `pagina`, `x`, `y`, `larghezza`, `altezza` | Posizione in punti PDF, utile per trovare una casella sul modello. L'origine è in alto a sinistra. |

## Già associati

| Area | Dati dell'app | Regola proposta |
| --- | --- | --- |
| Identità e stato | Nome, background, specie, classe, livello, PE, CA, PF, iniziativa, velocità, taglia, percezione passiva, bonus competenza | Copia del valore nella casella corrispondente; CA è solo il numero. |
| Caratteristiche e abilità | Punteggio, modificatore, bonus e competenza | Ricerca per abbreviazione della caratteristica o nome dell'abilità, così l'ordine nell'array può cambiare. |
| Armi | Nome, quantità, bonus, danno, note | Fino a sei voci. Quantità maggiore di uno accanto al nome come `xN`; provenienza e gittata restano nell'app. |
| Incantesimi | Livello, nome, tempo, gittata, note, spunte C/R/M | Fino a trenta voci. Durata e componenti testuali restano nell'app. |
| Altri dati | Privilegi, talenti, lingue, nomi dell'equipaggiamento, competenze armi e armatura, monete, allineamento | Testo eccedente tagliato nel PDF; il dato completo resta nell'app. |

## Regole concordate

1. `scudo`, `ispirazioneEroica` e C/R/M sono spunte booleane nell'app. I vecchi valori vengono convertiti alla lettura; dopo, il PDF usa solo le spunte.
2. L'app limita l'aggiunta a sei armi e trenta incantesimi. Il testo che non entra viene tagliato solo nell'esportazione.
3. Sottoclasse, PF temporanei, tiri salvezza contro la morte, aspetto, storia, valori da incantatore, slot, strumenti e sintonia restano vuoti.
4. I privilegi scorrono dalla prima alla seconda colonna. I talenti includono nome e descrizione. La casella Specie copia il testo completo dell'app; Tratti della specie resta vuoto.
5. `sheet.note`, note classe armatura, durata e componenti testuali degli incantesimi, dettaglio e provenienza dell'equipaggiamento restano solo nell'app.
6. Il PDF esportato è statico, senza caselle modificabili. Per aggiornarlo si modifica la scheda nell'app e si esporta di nuovo.

Le coordinate e i nomi tecnici provengono dal file `scheda.pdf` sul Desktop esaminato il 3 ottobre 2026. Se il modello viene sostituito, occorre verificare nuovamente le coordinate.
