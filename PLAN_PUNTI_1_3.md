# Piano di completamento dei punti 1 e 3 — Manuale del Giocatore 2024

## Obiettivo e confine

Portare **tutti i domini, i dati, le logiche non legate agli incantesimi e i testi
aperti toccando etichette o valori** a coincidere con
`docs/regole/Manuale Del Giocatore - 2024.pdf`, unica fonte delle regole.
Il riferimento da mostrare è la **pagina stampata** del manuale. I testi che
spiegano come usare l'app vanno identificati come aiuti dell'app e non attribuiti
al manuale. Le scelte personali inserite dall'utente restano distinte dai testi
normativi.

L'indice, i dettagli, le descrizioni e le logiche degli incantesimi appartengono
a `PLAN_INCANTESIMI.md` (punto 2). Le capacità non magiche di classi, specie e
talenti restano in questo piano; se una capacità concede o modifica un
incantesimo, verificarne qui concessione e requisito e rimandare l'effetto
dell'incantesimo al punto 2.

## Stato da cui ripartire

- I cataloghi principali, varie concessioni e diversi calcoli sono già stati
  aggiornati, ma **non esiste ancora una verifica esaustiva di tutti i popup**.
- `lib/valueDetails.ts` contiene descrizioni dedicate per 21/75 talenti,
  6/16 background e 12/48 sottoclassi. Le altre voci hanno spesso una sintesi
  generica, pur mostrando una pagina.
- `lib/class-feature-grants.json` e `lib/subclass-feature-grants.json` elencano
  174 privilegi di classe e 241 di sottoclasse per nome e livello; i singoli
  effetti e le pagine precise non sono coperti sistematicamente.
- `lib/equipmentDetails.ts` descrive nel dettaglio solo alcuni oggetti; per
  molti il popup espone peso e costo. Gli ID storici `srd52:` dell'equipaggiamento
  servono alla compatibilità delle schede e non costituiscono una fonte di regole.
- Il selettore delle lingue include standard e rare senza distinguere le due
  scelte iniziali dalle lingue ottenute tramite privilegi (manuale p. 37).
- L'ultima verifica automatica completata prima di questo piano era di 88 test
  superati e TypeScript senza errori: questo **non** certifica il confronto
  integrale con il PDF.

## Metodo obbligatorio per ogni voce

1. Aprire direttamente nel PDF locale la pagina pertinente; se testo estratto,
   tabella o impaginazione sono ambigui, controllare visivamente la pagina.
2. Registrare categoria, nome/ID, pagina stampata, campi strutturati, testo del
   popup, requisiti, scelte, livello di acquisizione ed eventuale effetto
   calcolato dall'app.
3. Confrontare uno a uno PDF e app. Correggere testo, dati e comportamento
   insieme; non mantenere un testo corretto accanto a una logica divergente.
4. Distinguere nel popup: **regola verificata** con pagina; **stato/calcolo del
   personaggio** con formula e pagina della regola; **aiuto dell'app** senza
   falsa attribuzione al manuale; **nota personale** senza attribuzione.
5. Non usare SRD, siti, altri manuali o ricordi per colmare lacune. Se il PDF
   non chiarisce un dato necessario, annotare la voce come aperta e chiedere
   indicazioni all'utente.

## Sequenza di lavoro della prossima sessione

### A. Inventario completo dei popup e dei domini

- Censire ogni `InfoLabel`, `valueInfoId` e altra apertura del pannello
  informativo in `app/personaggio/[id]/CharacterClient.tsx`, incluse le voci
  generate da cataloghi e i valori delle schede esistenti.
- Ricondurre ogni popup al generatore effettivo: `fieldHelp`, `valueDetails`,
  `recordedValueDetails`, `calculationExplanation`, `equipmentDetails`,
  `languageDetails`, dettagli di armi/strumenti/competenze/padronanze,
  concessioni di classe/specie/talento o composizione direttamente nella UI.
- Costruire una matrice tracciabile per **ogni** valore selezionabile e ogni
  tipo di etichetta, con stato `da verificare`, `verificato sul PDF`,
  `aiuto dell'app`, `personale` oppure `punto 2`. Non considerare «verificato»
  un generico riferimento alla prima pagina di una sezione.
- Confrontare in entrambe le direzioni tutti i domini non magici dell'app con
  gli elenchi del PDF: voci mancanti, obsolete, livelli, prerequisiti, scelte
  ripetibili e casi in cui è permesso un valore personalizzato.

**Uscita A:** inventario senza popup o opzioni non classificati; ogni
scostamento ha una pagina del PDF o una domanda esplicita per l'utente.

### B. Descrizioni e pagine, per gruppi chiusi

Lavorare nell'ordine seguente, chiudendo ogni gruppo prima di passare al
successivo:

1. **Talenti:** 10 Origini, 43 Generali, 10 Stili di combattimento, 12 Doni
   epici. Sostituire i fallback «Talento ... del Manuale» con benefici,
   requisiti, limiti, uso, recupero, ripetibilità e pagina specifica.
2. **Origine del personaggio:** 16 background, 10 specie e relativi lignaggi.
   Verificare tratti, scelte, livelli di sblocco, velocità, taglia, lingue,
   competenze e talenti concessi; completare i popup.
3. **Classi:** 12 classi, 48 sottoclassi e tutte le 415 voci di privilegio
   catalogate. Per ciascuna registrare pagina precisa, effetto, condizioni,
   progressione, risorse, scelte e testo visibile. Correggere le concessioni
   generate in `characterGrants.ts` quando non corrispondono al PDF.
4. **Equipaggiamento e regole comuni:** armi, proprietà e padronanze,
   armature, scudi, strumenti, oggetti e munizioni, lingue, competenze,
   condizioni e tutti i popup numerici o di stato mostrati dall'app. Per gli
   oggetti con effetto, aggiungere la regola oltre a peso e costo; non
   attribuire alla pagina della tabella il testo di una descrizione posta
   altrove.

**Uscita B:** ogni testo normativo visibile ha contenuto verificato e pagina
stampata pertinente; nessun fallback generico è scambiato per descrizione
completa. I testi dell'app sono riconoscibili come tali.

### C. Logiche, scelte e compatibilità

- Per ogni regola descritta in B, verificare ciò che l'app concede, limita,
  calcola o lascia inserire: prerequisiti, livelli, competenze, risorse,
  attacchi, CA, velocità, tiri, riposi e fonti delle scelte.
- Correggere la scelta delle lingue iniziali secondo p. 37, conservando le
  lingue rare attribuite da privilegi e le scelte personali già salvate.
- Applicare automaticamente solo le regole che l'app rappresenta davvero;
  quando un effetto resta manuale, dirlo chiaramente nel popup senza
  inventare un calcolo. Non creare una restrizione chiusa se il PDF permette
  una scelta libera o personalizzata.
- Verificare la lettura e la normalizzazione delle schede precedenti; non
  perdere note personali e non far riapparire valori di vecchi cataloghi.

**Uscita C:** testo e comportamento coincidono per ogni caso rappresentato;
le scelte manuali hanno confini espliciti e i salvataggi precedenti restano
leggibili.

### D. Verifica finale e dichiarazione di completamento

- Test di copertura dell'inventario: nessun valore catalogato, popup o
  privilegio dei gruppi A–C senza classificazione, testo adeguato e pagina
  quando è una regola del PDF.
- Test mirati per le regole corrette, inclusi requisiti, progressioni,
  ripetibilità e normalizzazione. Eseguire suite completa, TypeScript e build.
- Controllo finale dei testi esposti nella UI e ricerca di fallback generici,
  riferimenti SRD usati come fonte e pagine inesatte. Gli ID storici per la
  compatibilità sono ammessi solo se i dati mostrati sono stati verificati.
- Pubblicare il risultato soltanto dopo aver chiuso tutte le voci della
  matrice. Riportare separatamente le voci che il PDF non chiarisce e non
  dichiarare il 100% finché richiedono una decisione dell'utente.

## Primo passo operativo

All'inizio della prossima sessione: creare la matrice di A, poi verificare e
correggere sul PDF le **10 descrizioni dei talenti di Origine** (pp. 200–202),
compresi i popup e le logiche collegate. Proseguire con gli altri gruppi senza
considerare concluso il punto 3 dopo il solo primo lotto.
