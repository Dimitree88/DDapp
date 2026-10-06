# Piano modulare di adeguamento al Manuale del Giocatore 2024

## Risultato richiesto

L'intera app deve usare **solo** `docs/regole/Manuale Del Giocatore - 2024.pdf`
per regole, cataloghi, valori permessi, requisiti, effetti, formule e
descrizioni di gioco. Il piano riunisce i precedenti punti 1, 2 e 3, compresi
**tutti gli incantesimi**. La pagina mostrata all'utente è quella **stampata**
nel manuale, non il numero della pagina del file PDF.

Alla fine esisterà una **serie di file strutturati per dominio**, usati
direttamente dall'app come fonte dei popup e delle regole. Per esempio:

| Dominio | File previsti dopo il modulo di base |
| --- | --- |
| Allineamenti e definizioni generali | `lib/manuale-2024/allineamenti.json`, `lib/manuale-2024/etichette.json` |
| Background, specie e lignaggi | `lib/manuale-2024/background.json`, `lib/manuale-2024/specie.json`, `lib/manuale-2024/lignaggi.json` |
| Talenti | `lib/manuale-2024/talenti/origini.json`, file separati per Generali, Stili di combattimento e Doni epici |
| Classi e sottoclassi | Un file per classe in `lib/manuale-2024/classi/`, contenente anche le sue quattro sottoclassi e i loro privilegi |
| Armi, armature, strumenti e altri beni | File distinti in `lib/manuale-2024/equipaggiamento/` |
| Incantesimi | Indice unico e file in `lib/manuale-2024/incantesimi/`, suddivisi per livello e, se necessario, in blocchi di massimo 20 voci |
| Regole di calcolo | File distinti in `lib/manuale-2024/regole/`, collegati ai dati descrittivi e ai calcoli effettivi |

Ogni voce normativa contiene almeno **ID stabile, nome, descrizione fedele
alla voce del PDF e pagina stampata**. Aggiunge i campi utili al suo dominio:
requisiti, livello, opzioni, benefici, durata, uso, recupero, costo, peso,
danni, proprietà, gittata o formule. Tabelle e progressioni necessarie non
devono sparire in una sintesi. La struttura concreta viene fissata nel modulo
`F00`; il testo del manuale non deve essere duplicato in sintesi hardcoded
discordanti nei componenti React. Le note personali del giocatore rimangono
separate dalle descrizioni del libro.

## Comportamento richiesto al tocco

- **Etichetta generica** (per esempio «Allineamento» o «Classe Armatura»):
  definizione e regola generale del PDF con pagina; le istruzioni su come
  usare l'app sono presentate separatamente come aiuto dell'app.
- **Valore specifico** (qualunque allineamento, classe, background, specie,
  talento, privilegio, condizione o altra voce di catalogo): descrizione della
  **sua** voce nel libro, non un testo generico sulla categoria, più requisiti
  e caratteristiche utili al gioco. «Caotico neutrale» è soltanto un esempio
  di questo comportamento, non una priorità speciale.
- **Valore derivato del personaggio** (CA, iniziativa, attacco, danni, tiri,
  velocità, bonus, slot ecc.): valore attuale, formula **realmente applicata**,
  contributi e relative fonti, limiti o avvisi e pagina della regola. Se un
  effetto resta manuale, il popup deve dichiararlo invece di fingere di
  averlo calcolato.
- **Oggetto posseduto, arma, armatura o strumento**: descrizione del PDF,
  proprietà ed effetti d'uso, dati come peso, costo, danni, CA e gittata se
  pertinenti, quindi quantità e note personali distinti dal testo del libro.
- **Incantesimo**: testo della voce nel PDF, pagina e dati completi di lancio,
  bersaglio, durata, componenti, effetti e potenziamento, più lo stato di
  preparazione e le risorse del personaggio quando pertinenti.
- **Valore libero o campo esclusivo dell'app**: spiegazione dichiarata come
  aiuto dell'app o dato personale. Non attribuire al manuale ciò che non
  contiene. Se il PDF non chiarisce una regola necessaria, segnare il modulo
  come aperto e chiedere indicazioni all'utente.

Per tutte le descrizioni usare il testo del PDF, correggendo solo a capo e
artefatti di estrazione dopo controllo della pagina. Il caso di «Caotico
neutrale» a p. 39 serve come prova campione della fedeltà al libro; **lo stesso
criterio si applica a ogni altra voce**. `docs/manuale-copia/` può aiutare a
localizzare una pagina, ma non sostituisce il confronto col PDF originale.

## Tracciamento e lavoro su più computer

Ogni **modulo foglia** è una unità completabile in una sessione o in un piccolo
numero di sessioni, con file di dati distinti. La matrice di copertura creata
in `F00` assegna ogni etichetta/valore cliccabile a **un solo modulo**.

La fonte autorevole dello stato è **un file per modulo**:
`docs/adeguamento-2024/stato/<ID>.json`. I file iniziali sono già presenti.
Ogni file contiene ID, `stato`, `assegnatoA`, `branch`, `presoInCarico`,
`ultimoAggiornamento`, `evidenza` e `commitCompletamento`. Stati consentiti:
`da_fare`, `in_corso`, `pronto`, `completato`, `aperto`. La tabella qui sotto
definisce i moduli e le dipendenze; **non contiene una seconda copia dello
stato** che possa diventare incoerente. Quando `I00` crea i blocchi degli
incantesimi, deve creare anche un file di stato autonomo per ciascun blocco.

### Presa in carico obbligatoria, prima di modificare contenuti

1. Su `main` e con worktree pulito, eseguire `git pull --ff-only origin main`.
   **Rileggere dopo il pull** il file di stato del modulo scelto e quelli
   delle sue dipendenze: queste devono essere `completato`.
2. Se lo stato è `da_fare`, scrivere `in_corso`, nome dell'AI/computer,
   branch previsto e data/ora UTC. Creare **un commit che modifica solo quel
   file di stato** e fare subito `git push origin main`. La presa in carico
   esiste solo dopo che il push è riuscito.
3. Se il push viene rifiutato perché un altro computer ha aggiornato `main`,
   non fare force push e **non iniziare il lavoro**. Aggiornarsi, rileggere lo
   stato remoto e scegliere un altro modulo se è già `in_corso`. Non
   sovrascrivere la presa in carico altrui.
4. Solo dopo il push riuscito creare il branch `manuale-2024/<ID>` dal nuovo
   `main` e lavorare sui file assegnati. Prima di riprendere in una sessione
   successiva, fare pull/fetch e verificare di essere ancora l'assegnatario.
   Un modulo `in_corso` non viene preso da un'altra AI senza una riassegnazione
   esplicita e pubblicata; non scade automaticamente.

### Avanzamento e chiusura

1. Ogni branch modifica il **proprio file di dominio** e test con ID unico.
   Adapter condivisi, renderer dei popup, tipi comuni e migrazioni spettano
   ai moduli di integrazione `F00`, `R01` e `R02`. Se serve un file condiviso,
   annotare il requisito nell'evidenza o concordarne la proprietà prima.
2. Il modulo produce `docs/adeguamento-2024/evidenze/<ID>.md` con voci
   coperte, pagine PDF verificate, campi/effetti corretti, test, questioni
   aperte e commit/PR. L'evidenza è parte del branch, non un altro piano.
3. Dopo i test del modulo, pubblicare il branch e l'evidenza. Poi tornare su
   `main` pulito, fare pull, aggiornare **solo il proprio** file di stato a
   `pronto` e pubblicare immediatamente il commit di stato su `main`. Se il
   PDF è ambiguo, usare `aperto` con la domanda nell'evidenza e pubblicare
   allo stesso modo. L'integratore verifica e unisce il branch, poi aggiorna
   lo stato a `completato` su `main`, con commit di completamento ed evidenza.
4. Una sessione termina con push del proprio stato ed evidenza; lo stato
   `completato` richiede PDF, popup, logica, test e integrazione. Nessuna AI
   modifica lo stato di un modulo posseduto da un'altra senza accordo.

**Contratto di chiusura di ogni modulo:** copertura al 100% delle sue voci
assegnate; testo e pagina controllati nel PDF; domini e logiche coerenti;
popup mobile leggibili; test pertinenti superati; evidenza compilata; nessun
fallback generico o SRD spacciato per manuale. Questioni non chiarite dal PDF
restano `aperte` e impediscono la dichiarazione finale di conformità.

## Registro dei moduli

I numeri di voci sono la fotografia attuale e si confermano nell'inventario
`F00`. Per lo stato corrente leggere il file `stato/<ID>.json` dopo il pull.

| ID | Ambito e risultato esclusivo | Dipende da |
| --- | --- | --- |
| F00 | Inventario completo di schermate, popup, domini, esportazioni e valori dinamici; matrice voce→modulo; schema dei file per dominio; adapter di lettura, riferimenti di pagina e test di copertura | — |
| V01 | Allineamenti e relative definizioni generali; `allineamenti.json` | F00 |
| V02 | Caratteristiche, abilità, taglie, lingue, condizioni e relative etichette; file di valori comuni; due lingue standard iniziali distinte dalle rare | F00 |
| V03 | Tutti i 16 background, equipaggiamento/scelte iniziali, talenti e competenze concessi; `background.json` | F00 |
| V04 | Tutte le 10 specie, lignaggi, tratti e progressioni; `specie.json` e `lignaggi.json` | F00 |
| T01 | 10 talenti di Origine; `talenti/origini.json` | F00 |
| T02A | Prima metà alfabetica dei 43 talenti Generali; file proprio | F00 |
| T02B | Seconda metà alfabetica dei talenti Generali; file proprio | F00 |
| T03 | 10 Stili di combattimento; `talenti/stili.json` | F00 |
| T04 | 12 Doni epici; `talenti/doni-epici.json` | F00 |
| C01 | Barbaro e sue quattro sottoclassi; file della classe | F00 |
| C02 | Bardo e sue quattro sottoclassi; file della classe | F00 |
| C03 | Chierico e sue quattro sottoclassi; file della classe | F00 |
| C04 | Druido e sue quattro sottoclassi; file della classe | F00 |
| C05 | Guerriero e sue quattro sottoclassi; file della classe | F00 |
| C06 | Ladro e sue quattro sottoclassi; file della classe | F00 |
| C07 | Mago e sue quattro sottoclassi; file della classe | F00 |
| C08 | Monaco e sue quattro sottoclassi; file della classe | F00 |
| C09 | Paladino e sue quattro sottoclassi; file della classe | F00 |
| C10 | Ranger e sue quattro sottoclassi; file della classe | F00 |
| C11 | Stregone e sue quattro sottoclassi; file della classe | F00 |
| C12 | Warlock e sue quattro sottoclassi; file della classe | F00 |
| E01 | Armi, proprietà, padronanze, attacchi e dati di catalogo | F00 |
| E02 | Armature, scudi, proprietà, CA e dati di catalogo | F00 |
| E03 | Strumenti, varianti, competenze, prove e creazioni | F00 |
| E04 | Equipaggiamento d'avventura, munizioni e oggetti con effetti d'uso; suddividere in file/blocchi disgiunti da massimo 25 voci | F00 |
| E05 | Mezzi, cavalcature, servizi, costi e altre voci di equipaggiamento selezionabili | F00 |
| I00 | Indice completo degli incantesimi dal PDF, schema della voce, pagine, liste di classe e ripartizione in blocchi | F00 |
| I0–I9 (famiglia non assegnabile) | Contenuto integrale degli incantesimi di livello 0–9; per ogni livello creare blocchi `I<livello>-<nn>` da massimo 20 voci, ciascuno con file, branch, stato ed evidenza propri | I00 |
| I10 | Logiche comuni degli incantesimi: selezione, preparazione, slot, lancio, recupero, CD, attacchi e interazioni | I0–I9, C01–C12, T01–T04 |
| R01 | Integrazione dei dati nei popup, formule e domini dell'app; eliminazione dei fallback; verifica delle etichette generiche e dei popup composti | Tutti i moduli V/T/C/E/I |
| R02 | Compatibilità e migrazione delle schede precedenti, esportazioni e dati salvati; verifica della destinazione prima di scrivere nel database | R01 |
| Q01 | Copertura integrale, regressioni, verifica mobile, TypeScript, build e dichiarazione finale | R02 |

Durante `F00` si congelano i confini alfabetici di `T02A/T02B`, la lista dei
blocchi di `E04` e l'elenco di tutti i blocchi di incantesimi `I<livello>-<nn>`.
Ogni blocco aggiunto diventa una **riga autonoma** nel registro prima di essere
assegnato. Un modulo grande si divide in nuove righe e nuovi file, mai in due
computer che modificano lo stesso file.

## Verifiche obbligatorie per famiglia

- **Cataloghi e domini:** confronto in entrambe le direzioni con il PDF di
  nomi, voci mancanti/estranee, requisiti, livelli, scelte ripetibili, valori
  liberi e limiti. Nessun selettore chiuso se il manuale permette altro.
- **Classi, specie e talenti:** per ogni privilegio, testo della voce, pagina
  precisa, livello, scelte, risorse, recupero, concessioni ed effetto reale.
  I 174 privilegi di classe e 241 di sottoclasse oggi solo catalogati vanno
  verificati individualmente.
- **Equipaggiamento:** oltre a costo e peso, descrizione ed effetto d'uso del
  libro; pagina della descrizione quando diversa da quella della tabella.
- **Incantesimi:** ricostruzione dell'indice completo dal PDF, confronto in
  entrambe le direzioni, ogni descrizione e dato strutturato, varianti e
  potenziamenti. Rimuovere dall'interfaccia dettagli/sintesi SRD e mantenere
  alias storici solo per leggere le vecchie schede.
- **Calcoli:** valore attuale, formula applicata, contributi, condizioni,
  avvisi e pagina. Testare testo e risultato insieme; non dire «applicato» se
  l'effetto richiede ancora inserimento manuale.
- **Persistenza:** mantenere note e scelte personali, convertire solo ciò che
  il PDF consente di mappare con certezza, non far riapparire vecchie regole.

## Verifica finale dell'intero piano

`Q01` può essere marcato `verificato` solo quando:

1. La matrice non ha righe senza modulo o senza esito; tutti i moduli foglia
   sono `verificato`, senza questioni `aperte` non risolte.
2. Ogni etichetta/valore di gioco pertinente apre il contenuto richiesto dal
   contratto dell'interfaccia. Tutte le descrizioni normative vengono dal
   PDF locale e riportano la pagina; nessun fallback generico nasconde una
   voce incompleta. Il controllo a campione di «Caotico neutrale» è uno fra
   molti, non l'unico test.
3. Ogni valore consentito, requisito, effetto rappresentato e formula
   applicata coincide col PDF. Test di copertura, regressione e compatibilità
   passano; TypeScript, build e `git diff --check` passano.
4. La UI mobile, l'inventario, le armi, gli incantesimi, i valori calcolati
   e le esportazioni sono verificati. Gli ID tecnici storici possono restare
   solo se non veicolano dati o regole obsolete.

**Solo allora** dichiarare l'app adeguata al 100% al Manuale del Giocatore
2024. Se il PDF non contiene o non chiarisce una regola necessaria, annotare
la voce e chiedere indicazioni all'utente; non completarla con altre fonti.

## Avvio della prossima sessione

Eseguire `F00` e integrare la sua struttura comune. Pubblicare il commit di
base, poi assegnare moduli di contenuto indipendenti ai diversi computer.
Nessun dominio, incluso quello degli allineamenti, ha precedenza normativa
sugli altri: l'esempio di «Caotico neutrale» serve a definire la qualità
attesa per **tutte** le descrizioni.
