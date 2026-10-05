# Copia testuale del Manuale del Giocatore 2024

Strumenti per ricavare dal PDF locale `docs/regole/Manuale Del Giocatore - 2024.pdf`
una copia testuale organizzata e consultabile. La copia contiene il testo del
manuale: si trova in `docs/manuale-copia/`, che resta solo in locale ed è
ignorata da Git (il repository è pubblico). In Git ci sono solo questi script
e lo stato delle verifiche (`stato-verifica.json`, con hash e nessun testo).

Requisiti: Python 3 con PyMuPDF (`pip install pymupdf`).

## Comandi

```bash
python scripts/manuale/estrai.py        # inventario + estrazione (grezzo/, auto/, inventario.json)
python scripts/manuale/assembla.py      # capitoli/ e indice.md
python scripts/manuale/cerca.py palla di fuoco
python scripts/manuale/cerca.py "classe armatura" --titoli
python scripts/manuale/verifica.py stato
```

Su Windows, se la console mostra male gli accenti, impostare `PYTHONIOENCODING=utf-8`.

`cerca.py` cerca tutti i termini nello stesso blocco (paragrafo, voce, riga di
tabella), ignorando maiuscole, accenti, apostrofi e trattini. Se non trova nulla
riprova ignorando gli spazi. Mostra prima i titoli (incantesimi, privilegi,
talenti), poi gli altri risultati. Ogni risultato riporta la pagina stampata, la
pagina PDF e il percorso di sezione. Opzioni: `-n` numero di risultati, `-c`
blocchi di contesto, `--titoli` solo titoli.

## Struttura di `docs/manuale-copia/`

| Cartella/file | Contenuto | Rigenerabile |
|---|---|---|
| `inventario.json` | hash SHA-256, pagine, capitoli, pagine senza testo o con immagini | sì |
| `grezzo/pNNN.json` | righe con coordinate e corpo del carattere | sì |
| `auto/pNNN.md` | ricostruzione automatica della pagina | sì |
| `verificato/pNNN.md` | trascrizione confrontata con la pagina renderizzata | **no**, mai sovrascritta |
| `correzioni/pNNN.diff` | differenze auto → verificato (tracciano ogni correzione) | sì |
| `capitoli/*.md` | copia per capitolo con ancore `#pNNN` | sì |
| `indice.md` | capitoli e segnalibri del PDF con pagine e collegamenti | sì |
| `render/` | PNG delle pagine per il confronto visivo | sì |

Per ogni pagina la copia usa `verificato/` se la pagina è registrata come
verificata, altrimenti `auto/`, segnalata come NON VERIFICATA.

## Come è fatta l'estrazione

Il PDF è una scansione con uno strato di testo OCR. `estrai.py`:

- ricompone gli spazi dalla geometria dei glifi (l'OCR inserisce spazi spuri);
- ordina la lettura per fasce e colonne, unisce le celle delle tabelle e i paragrafi;
- riconosce i titoli dal corpo del carattere e riunisce le parole spezzate nei
  titoli in maiuscoletto usando il vocabolario del testo;
- corregge confusioni sistematiche (`ld20` → `1d20`, `+O` → `+0`, `lsmark` → `Ismark`, ecc.).

Limiti noti del testo automatico: alcuni riquadri e didascalie possono avere
frasi in ordine diverso dall'originale, le tabelle complesse possono avere celle
spezzate su più righe e restano rari errori OCR. In caso di dubbio fa fede il PDF.

## Verifica visiva

Le pagine 1-21 sono state verificate una per una con le pagine renderizzate. Per
decisione dell'utente le altre pagine usano il testo automatico, senza
confronto visivo. Per verificare altre pagine:

1. `python scripts/manuale/verifica.py rendi N N`, poi apri `render/pNNN.png`
   (`verifica.py zoom N alto basso` ingrandisce una fascia);
2. scrivi `verificato/pNNN.md` (prima riga `<!-- pagina PDF N … -->`);
3. `python scripts/manuale/verifica.py controlla N` confronta con l'OCR;
4. `python scripts/manuale/verifica.py segna N` registra la verifica.

`verifica.py stato` segnala le pagine modificate dopo la verifica. Con una
versione diversa del PDF (hash diverso da `PDF_SHA256` in `comune.py`)
le parti cambiate vanno verificate di nuovo.
