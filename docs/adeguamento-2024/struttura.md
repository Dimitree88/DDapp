# Struttura dei file per dominio (F00)

Questa è la struttura comune fissata da `F00` per il piano
[`PLAN_ADEGUAMENTO_2024.md`](../../PLAN_ADEGUAMENTO_2024.md). La fonte di
regole, testi e pagine resta soltanto `docs/regole/Manuale Del Giocatore - 2024.pdf`.

## File e proprietari

Tutti i file stanno in `lib/manuale-2024/`. Ogni file ha **un solo modulo
proprietario**, dichiarato nel campo `modulo` e in
[`lib/manuale-2024/domini.ts`](../../lib/manuale-2024/domini.ts). Un modulo
modifica solo i propri file; `F00` li ha già creati vuoti e registrati in
[`registro.ts`](../../lib/manuale-2024/registro.ts), quindi nessun altro file
condiviso va toccato per aggiungere voci.

| Modulo | File |
| --- | --- |
| V01 | `allineamenti.json` |
| V02 | `caratteristiche.json`, `abilita.json`, `taglie.json`, `lingue.json`, `condizioni.json`, `regole/caratteristiche.json` |
| V03 | `background.json` |
| V04 | `specie.json`, `lignaggi.json` |
| V05 | `etichette.json`, `regole/generali.json` |
| T01 · T02A · T02B · T03 · T04 | `talenti/origini.json` · `talenti/generali-a.json` · `talenti/generali-b.json` · `talenti/stili.json` · `talenti/doni-epici.json` |
| C01–C12 | `classi/<classe>.json` (classe, quattro sottoclassi e tutti i privilegi) |
| E01 | `equipaggiamento/armi.json`, `regole/attacchi.json` |
| E02 | `equipaggiamento/armature.json`, `regole/classe-armatura.json` |
| E03 | `equipaggiamento/strumenti.json` |
| E04 | `equipaggiamento/avventura-01.json` … `avventura-04.json` |
| E05 | `equipaggiamento/cavalcature-veicoli.json`, `equipaggiamento/servizi.json`, `equipaggiamento/monete.json` |
| I00 | `incantesimi/indice.json` e creazione dei file `incantesimi/<blocco>.json` |
| I<livello>-<nn> | `incantesimi/<blocco>.json` (blocchi congelati in `incantesimi/blocchi.json`) |
| I10 | `regole/incantesimi.json` |

`I00` crea i file dei blocchi e il file di stato di ogni blocco, poi rigenera
il registro con `node --import tsx scripts/adeguamento-2024/genera-registro.mjs`
(`registro.ts` è generato: non va modificato a mano). `R01` integra adapter e popup; `R02` gestisce dati salvati
ed esportazioni. Se un modulo ha bisogno di cambiare logica condivisa (per
esempio `lib/classSkillChoices.ts` o `lib/spellcasting.ts`), registra nel proprio
file i dati corretti e annota nell'evidenza la modifica richiesta a `R01`.

## Formato del file

```json
{
  "dominio": "talenti/origini",
  "modulo": "T01",
  "fonte": "docs/regole/Manuale Del Giocatore - 2024.pdf",
  "tipoPagina": "stampata",
  "etichette": [],
  "voci": []
}
```

- `etichette`: definizioni generali delle etichette del dominio (tipo
  `etichetta`), per esempio «Background». Le etichette trasversali a più
  domini (Classe, Livello, Talenti, Privilegi…) stanno in `etichette.json` (V05).
- `voci`: voci normative del dominio. I tipi ammessi per file sono in `domini.ts`.

## Voce

Campi comuni (tipi completi in [`schema.ts`](../../lib/manuale-2024/schema.ts)):

| Campo | Regola |
| --- | --- |
| `id` | Stabile, minuscolo, con almeno un prefisso: `talento:allerta`, `classe:barbaro:privilegio:ira`. Unico in tutto il manuale; non cambia se si corregge il nome. |
| `tipo` | Uno dei tipi di `schema.ts`; determina i campi obbligatori. |
| `nome` | Nome come stampato nel PDF. |
| `testo` | Facoltativo solo se la voce è interamente una riga di tabella del libro, registrata in `tabelle`. Ancore della descrizione nel PDF: `[{ "pagina": 39, "da": "Caotico neutrale (CN)", "a": "Legale malvagio (LM)" }]`. Il segmento parte dopo `da` (o dalla riga successiva se `da` è un titolo; `includiDa: true` lo comprende) e termina prima di `a`, alla fine della pagina con `finePagina: true` o, altrimenti, al titolo successivo; può proseguire sulle quattro pagine seguenti. Se il testo dell'ancora compare più volte, `n` (per `da`, sulla pagina) e `na` (per `a`, dopo l'inizio) scelgono l'occorrenza; `scripts/adeguamento-2024/occorrenze.mjs <pagina> <testo>` le elenca. Con `unisci: true` il segmento diventa un unico paragrafo, se sulla pagina non ci sono rientri. Più ancore si uniscono in paragrafi. |
| `correzioni` | Coppie `[testo estratto, testo corretto]` per artefatti OCR verificati sulla pagina (parole unite o spezzate, cifre confuse, celle spurie). Una correzione che non trova più il testo è un errore. |
| `pagina` | Pagina **stampata** in cui inizia la voce, dentro gli intervalli del dominio. |
| `pagine` | Altre pagine stampate pertinenti (tabella, seguito della voce). |
| `alias` | Solo nomi storici necessari a leggere vecchie schede o valori dell'app (es. «Leggere» per le armature leggere). |
| `tabelle` | Tabelle e progressioni della voce: `titolo`, `pagina`, `colonne`, `righe`. Non vanno ridotte a sintesi. |
| `righeMatrice` | ID delle righe di [`matrice.json`](matrice.json) servite dalla voce: obbligatorio per coprire etichette e valori derivati. |
| `verifica` | `{ "stato": "verificata" }` dopo il confronto col PDF; `da_verificare` per bozze; `aperta` con `note` contenente la domanda per l'utente. |

Campi specifici principali: talenti (`categoria`, `prerequisito`, `ripetibile`),
classi (`dadoVita`, `caratteristicaPrimaria`, `tiriSalvezza`, `competenze`,
`equipaggiamentoIniziale`, `privilegi`), sottoclassi (`classe`, `privilegi`),
specie (`tipoCreatura`, `taglia`, `velocita`, `tratti`), background
(`punteggiCaratteristica`, `talento`, `competenzeAbilita`,
`competenzaStrumenti`, `equipaggiamento`), armi, armature, strumenti e oggetti
(`peso` e `costo` come stampati più `pesoKg` e `costoMo` numerici o `null`),
incantesimi (`livello`, `scuola`, `classi`, `tempoLancio`, `rituale`,
`gittata`, `componenti`, `durata`, `concentrazione`), regole
(`formula` del manuale e `calcolo`, cioè la funzione dell'app che la applica).
I privilegi annidati usano gli stessi campi comuni più `livello` e `risorse`
(`nome`, `usi`, `recupero`).

Le note e le scelte del giocatore non entrano mai in questi file.

## Testi estratti dal PDF

La descrizione non si scrive a mano: per decisione dell'utente è estratta dal
PDF locale, attraverso la copia automatica `docs/manuale-copia/auto/`
(rigenerabile con `python scripts/manuale/estrai.py`), seguendo le ancore.

```bash
node --import tsx scripts/adeguamento-2024/estrai.mjs talenti/origini            # scrive testi/talenti/origini.json
node --import tsx scripts/adeguamento-2024/estrai.mjs --sospetti talenti/origini  # parole anomale da controllare
node --import tsx scripts/adeguamento-2024/estrai.mjs --controlla                 # tutti i file aggiornati?
```

I file `lib/manuale-2024/testi/<dominio>.json` sono generati e versionati
(l'app non esegue l'estrazione). Il modulo confronta ogni testo con la pagina
renderizzata del PDF, registra in `correzioni` gli artefatti da sistemare e
rigenera il file. Le ancore ignorano maiuscole, accenti, spazi, punteggiatura e
le confusioni OCR l/i/!/1, o/0, s/5, rn/m.

## Adapter e pagine

- [`lib/manuale-2024/index.ts`](../../lib/manuale-2024/index.ts):
  `voceManuale(dominio, nomeOId)`, `etichettaManuale(nome)`,
  `privilegioManuale(nome, { classe, sottoclasse, specie, lignaggio, livello })`,
  `manuale.perId(id)`, `bloccoIncantesimo(livello, nome)` e
  `bloccoEquipaggiamentoAvventura(voceMadre)`. Il confronto dei nomi ignora
  maiuscole, accenti e apostrofi tipografici. Se la voce non c'è, il risultato
  è `null`: l'interfaccia non deve inventare un testo sostitutivo. Ogni
  risultato indica `verificata`, la `descrizione` estratta e il riferimento
  «Manuale del Giocatore 2024, p. N».
- [`lib/manuale-2024/pagine.ts`](../../lib/manuale-2024/pagine.ts): pagina
  stampata = pagina PDF − 3, intervalli dei capitoli, `riferimentoManuale`.

`registro.ts` importa i file in modo statico. `R01` può passare a un
caricamento per dominio se il peso del bundle mobile lo richiede, senza
cambiare il formato dei file.

## Matrice e copertura

[`matrice.json`](matrice.json) assegna ogni etichetta, valore, calcolo,
esportazione e campo dell'app a un solo modulo (`modulo`) o a una regola per
valore (`moduloPerValore`: classe, sottoclasse, talento, incantesimo, oggetto).
[`scripts/adeguamento-2024/copertura.ts`](../../scripts/adeguamento-2024/copertura.ts)
espande le righe nei valori dei cataloghi attuali e calcola l'esito:

- un **valore** è coperto da una voce `verificata` del suo modulo con lo stesso
  nome o alias (per privilegi e tratti, dentro la classe, sottoclasse, specie o
  lignaggio di appartenenza);
- un'**etichetta** o un **calcolo** è coperto da una voce `verificata` del suo
  modulo che cita la riga in `righeMatrice`;
- le righe `app` sono gestite da R01/R02 e verificate da Q01 nell'interfaccia.

Report: `node --import tsx scripts/adeguamento-2024/report.mjs` (tutti i
moduli) oppure `… report.mjs V01` (elenco di ciò che manca).

La matrice elenca i valori **mostrati dall'app oggi**. Ogni modulo deve anche
confrontare il proprio catalogo col PDF in entrambe le direzioni: voci del PDF
assenti dall'app e voci dell'app assenti dal PDF vanno riportate nell'evidenza
e, se cambiano i cataloghi, segnalate a R01/R02.

## Test di ogni modulo

Ogni modulo aggiunge `scripts/test-manuale-2024-<ID>.mjs`, che almeno:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";

test("<ID> covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("<ID>");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});
```

e aggiunge le verifiche proprie del dominio (conteggi del PDF, campi, effetti e
calcoli realmente applicati). `scripts/test-manuale-2024-F00.mjs` valida già
schema, ID unici, pagine nel dominio, testi estratti aggiornati e privi di
artefatti e coerenza della matrice per tutti i file.

Tutti i test: `node --import tsx --test scripts/test-*.mjs`.
