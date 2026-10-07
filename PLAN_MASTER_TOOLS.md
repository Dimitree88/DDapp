# Piano per la vista Master

## Obiettivo e confini

Una pagina `/master` permette prima di **creare una Sessione** e poi mostra
**tutti i personaggi** del database in un'unica vista, con i dati necessari a
condurla e azioni rapide per registrare ciò che accade. È un pannello
operativo, non una seconda scheda del personaggio.

Decisione dell'utente del 6 ottobre 2026: tutti possono aprire qualunque
pagina. La prima versione **non introduce account, ruoli, inviti o permessi**;
il gruppo si accorda direttamente su chi usa la vista Master. Lo storico
registra l'origine «vista Master», senza fingere di identificare chi ha
premuto il comando.

Decisione successiva dell'utente: il Master assegna un nome alla Sessione; la
data è impostata automaticamente al giorno di creazione. Ogni modifica fatta
dalla vista Master appartiene alla Sessione aperta e appare **subito** nella
scheda del personaggio. La chiusura archivia eventi e riepilogo, senza
rimandare fino a quel momento l'aggiornamento delle schede.

Decisione successiva: Ispirazione eroica e PE sono in sola lettura nella
scheda del personaggio. `saveSheet` rifiuta modifiche dirette a questi campi.
La vista Master registra concessione, spesa o trasferimento dell'Ispirazione
e assegnazione o correzione dei PE con azioni dedicate, fonte e storico.
L'Ispirazione può essere concessa anche da una regola e spesa dal personaggio:
la vista Master registra questi eventi, senza attribuirli automaticamente a
una decisione del DM. Il wizard di cambio livello legge i PE ma non li assegna.

Il Master registra gli esiti degli eventi. L'app calcola soltanto le
conseguenze sostenute dal PDF locale e dai dati verificati della scheda.
Scelte permanenti di classe, talenti, privilegi e avanzamento appartengono ai
wizard di creazione e cambio livello, non ai controlli rapidi del Master.
Il riposo è disponibile anche nella scheda del singolo personaggio: la vista
Master aggiunge il comando collettivo, non ne diventa l'unica via.
L'assetto delle mani e il flusso di attacco seguono
`PLAN_ARMI_ATTACCHI.md`: cambiare arma impugnata è un evento di gioco,
distinto dal cambio delle armi scelte per la Padronanza al riposo lungo.

## Ciclo di vita della Sessione

1. **Creazione.** «Nuova Sessione» chiede un nome e mostra la data automatica
   del giorno di creazione secondo `Europe/Rome`. Salvare anche gli istanti
   UTC di creazione e chiusura. La data esposta è una data storica della
   Sessione: non cambia a mezzanotte o quando viene riaperta la pagina.
   Inizialmente tutti i personaggi sono visibili; il Master indica i
   partecipanti effettivi, modificabili finché la Sessione è aperta.
2. **Sessione aperta.** Per la prima versione c'è una sola Sessione aperta
   alla volta. La testata mostra nome, data, partecipanti e comandi «Eventi»
   e «Chiudi Sessione». Ogni comando dalla vista Master richiede l'ID della
   Sessione aperta, registra l'evento e aggiorna immediatamente la scheda.
   Azioni di gruppo indicano esplicitamente i destinatari; non attribuiscono
   PE o riposi ai personaggi assenti per semplice inclusione nella lista.
3. **Cronologia.** La Sessione mostra eventi in ordine temporale: personaggio,
   azione, valore prima/dopo, fonte o nota, ora e collegamento alla scheda.
   Una correzione prima della chiusura è un nuovo evento che compensa quello
   errato, senza riscrivere la cronologia. Se una modifica parte dalla scheda
   di un partecipante mentre la Sessione è aperta, **compreso un riposo
   individuale**, viene collegata allo stesso contesto con provenienza
   «scheda», distinta da «vista Master».
4. **Chiusura.** Una schermata finale riepiloga per ogni partecipante le
   modifiche, gli stati ancora attivi e gli eventuali dati mancanti. Dopo la
   conferma, la Sessione diventa `chiusa`: eventi e riepilogo storico sono
   immutabili, e non accetta nuove azioni. Una rettifica successiva appartiene
   a una nuova Sessione e cita l'evento precedente.

**«Congelare sulle schede» significa consolidare il risultato**, non applicare
solo alla chiusura una bozza nascosta: PE, PF attuali, Ispirazione, risorse
spese, monete e altri cambiamenti persistenti sono già visibili durante la
Sessione e restano dopo. Iniziativa, round e note tattiche legate al solo
incontro restano nell'archivio della Sessione. Una condizione, concentrazione,
PF temporanei o un altro effetto di durata limitata **non scade per il solo
fatto che la Sessione finisce**: continua sulla scheda finché la sua regola
ne determina la fine. Chiudere la Sessione non applica un riposo breve o
lungo, non ripristina PF/slot e non azzera condizioni. Questo distingue la
struttura organizzativa dell'app dalle durate indicate nel PDF (pp. 29, 364,
371).

## Fonte e pagine verificate

Per regole e contenuti di gioco usare solo
`docs/regole/Manuale Del Giocatore - 2024.pdf`. Pagine **stampate** lette
direttamente nel PDF per definire questo piano:

| Pagine | Fatto pertinente alla vista |
| --- | --- |
| 13 | Il DM può conferire Ispirazione eroica; se ne può avere una sola alla volta e si può spendere. |
| 23 | Iniziativa, ordine dei turni e round di combattimento. |
| 27–29 | PF attuali e massimi, danni, resistenza e vulnerabilità, guarigione, 0 PF, morte, tiri salvezza contro morte, stabilità, PF temporanei e condizioni. |
| 41 | PE, soglie di livello e bonus di competenza. |
| 51, 91, 101, 132, 141, 206 | Barbaro, Guerriero, Ladro, Paladino, Ranger e il talento Maestro d'Armi permettono di cambiare armi scelte per la Padronanza dopo un riposo lungo, secondo i limiti della rispettiva fonte. |
| 59, 69, 79, 95, 108, 112–113, 131, 141, 151, 165 | I tempi e limiti per cambiare incantesimi preparati dipendono dalla classe o sottoclasse; il mago distingue libro e lista preparata e può copiare incantesimi trovati. La Magia del Patto del Warlock recupera slot al riposo breve o lungo. |
| 81, 201, 202, 206, 211 | Forma Selvatica, Fortunato e altre risorse hanno recuperi propri; alcune scelte di privilegi e talenti possono cambiare al riposo lungo, secondo la voce specifica. |
| 235–238 | Lancio degli incantesimi, slot e dati di lancio; ogni automatismo specifico dipende dalla voce e dalla classe verificate. |
| 364 | Concentrazione e suoi modi di interruzione. |
| 366 | Indebolimento: livelli, effetti e riduzione con riposo lungo. |
| 371 | Riposo breve e lungo, requisiti, interruzioni e benefici generali; le ricariche delle capacità dipendono dal loro testo. |

Le descrizioni e ricariche di privilegi, talenti, incantesimi, oggetti e
condizioni devono essere confrontate con le rispettive pagine prima di
automatizzarle. Se il PDF non chiarisce un effetto, l'app ne registra l'esito
deciso al tavolo senza attribuire al manuale una formula inventata.

## Vista a colpo d'occhio

La home offre un ingresso evidente a «Master». Senza una Sessione aperta, la
pagina mostra «Nuova Sessione» e l'archivio delle Sessioni chiuse; i controlli
di modifica sono disponibili soltanto dentro una Sessione aperta. Lì usa una
lista di schede compatta su mobile e una griglia su schermi più ampi, con
nome e ricerca rapida. Tutte le schede provengono dal database attuale; una
futura separazione per campagne richiederà una decisione distinta.

Ogni scheda mostra, senza aprire il personaggio:

- **Identità:** nome, classe, livello, sottoclasse se presente.
- **Sopravvivenza:** PF attuali / massimi, barra leggibile, PF temporanei,
  indicatore a 0 PF, stabile o morto quando pertinente.
- **Combattimento:** CA, bonus di iniziativa e percezione passiva calcolati;
  iniziativa tirata durante l'incontro se registrata.
- **Stati:** Ispirazione eroica, condizioni attive, livello di Indebolimento,
  concentrazione attiva e avvisi pertinenti.
- **Risorse:** riepilogo compatto di Dadi Vita disponibili, slot spesi e
  risorse con utilizzi, quando i relativi dati sono affidabili.
- **Progressione:** PE attuali e distanza dalla soglia del livello successivo.

Un valore mancante compare come «da registrare», mai come 0 presunto. Colore
e testo comunicano insieme lo stato; i pulsanti restano utilizzabili al tocco
su mobile. Il dettaglio espanso mostra effetti, fonti, pagine del manuale,
scelte già prese e le ultime modifiche della sessione.

## Azioni del Master, in ordine di priorità

| Priorità | Azione | Comportamento previsto |
| --- | --- | --- |
| Prima | **Assegnare PE** | Inserire un incremento per un personaggio, oppure distribuirlo a un gruppo selezionato. Mostrare prima/dopo e soglia del livello successivo. Una correzione del totale è un comando distinto, con motivo. Raggiungere la soglia segnala il cambio livello disponibile, senza eseguirlo automaticamente. |
| Prima | **Danni e guarigione** | Inserire danno effettivo o PF recuperati; mostrare prima/dopo. Il danno consuma prima i PF temporanei. La guarigione si ferma ai PF massimi. A 0 PF si apre il flusso per stabilità e tiri salvezza contro morte. Le eccezioni di danno e morte richiedono contesto e conferma. |
| Prima | **Ispirazione eroica** | Conferire o segnare come spesa. Se il destinatario la possiede già, mostrare che non si accumula e offrire il trasferimento a un altro personaggio idoneo, come previsto dal PDF. |
| Prima | **Condizioni e Indebolimento** | Applicare/rimuovere una condizione con fonte, durata o nota; mostrare più fonti senza sommare lo stesso effetto. Indebolimento usa un contatore separato, con le conseguenze e il limite del PDF. |
| Prima | **PF temporanei e tiri salvezza contro morte** | Registrare una nuova concessione di PF temporanei scegliendo se mantenere i precedenti o usare i nuovi, mai sommarli. Contare successi/fallimenti, stabilizzazione e gli esiti speciali del tiro; chiedere il contesto per danni subiti a 0 PF. |
| Dopo i dati 2024 pertinenti | **Riposo breve/lungo di gruppo** | Il Master lo avvia dalla Sessione per tutti i partecipanti presenti, con possibilità di escludere chi non riposa. Verificare i requisiti di ciascuno, mostrare l'anteprima su tutte le schede e chiedere i tiri/scelte necessari. Riposo breve: spesa dei Dadi Vita e recuperi specifici. Riposo lungo: benefici generali, ricariche specifiche e possibilità di sostituire una Padronanza d'armi quando la fonte del personaggio lo consente, senza azzerare genericamente tutte le risorse. |
| Dopo i dati 2024 pertinenti | **Slot e risorse** | Un comando guidato della Sessione registra l'uso di una capacità posseduta e ne scala gli utilizzi, con limite, fonte e tipo di ricarica verificati. Il recupero avviene solo all'evento previsto dalla fonte, inclusi riposo o altra condizione esplicita. Il Master può correggere un conteggio con motivo in un comando distinto; un incantesimo o privilegio non ancora verificato resta un'annotazione manuale dichiarata. La pagina Privilegi mostra anche gli usi spesi in sola lettura. |
| Fase successiva | **Incontro** | Registrare i risultati di iniziativa, ordinare personaggi e creature, indicare turno/round e concentrazione. Le schede delle creature condivise o degli esemplari della Sessione seguono `PLAN_CREATURE.md`: i loro dati personalizzati sono inseriti dal gruppo, mai inventati dall'app. |
| Fase successiva | **Beni e altri effetti** | Annotare acquisizione/spesa di monete, oggetti e consumabili; registrare effetti temporanei con fonte e scadenza. Modificare CA, velocità, PF massimi o caratteristiche solo tramite una regola verificata oppure come esito manuale chiaramente etichettato. |

Il Master può vedere i valori di abilità, tiri salvezza, competenze, lingue e
incantesimi preparati per consultazione rapida. Non occorre un pulsante per
registrare ogni tiro di dado o rifare l'intera scheda nella vista Master.

## Altri strumenti utili, senza appesantire i controlli principali

1. **Consultazione del gruppo.** Una vista di confronto, solo lettura, per
   Percezione passiva, bonus dei tiri salvezza, abilità, competenze,
   strumenti, lingue, velocità, CA e CD degli incantesimi. Ricerca come
   «chi parla questa lingua?» o «chi ha la Percezione passiva più alta?».
   I valori vengono dalla scheda e dalle formule già verificate, non da una
   seconda copia (pp. 11–14 e 40). È la prima aggiunta consigliata.
2. **Prova o tiro salvezza richiesto a più personaggi.** Il Master sceglie
   destinatari, caratteristica o abilità e CD; la vista mostra il bonus di
   ciascuno e permette di annotare i risultati comunicati dai giocatori.
   L'esito non applica automaticamente danni o condizioni: il testo
   dell'effetto e la decisione del Master determinano cosa succede (p. 11).
3. **Appunti e riepilogo della Sessione.** Titolo della scena, luogo,
   personaggi non giocanti incontrati, decisioni e questioni da riprendere.
   Il riepilogo propone gli eventi già registrati e lascia al Master
   aggiungere un testo libero. Sono dati narrativi dell'app, non regole del
   manuale. Poiché non ci sono permessi, gli appunti sono visibili a tutti.
4. **Scadenze degli effetti.** Durante un incontro mostrare quando controllare
   una condizione, un effetto o la concentrazione in base a round, turni,
   minuti, riposo o evento di fine specificato. Un promemoria non fa
   terminare automaticamente un effetto quando la fonte o la durata non sono
   certe; la chiusura della Sessione non è una scadenza di gioco.
5. **Ricompense e bottino distribuiti.** Partire da un evento di gruppo e
   assegnare monete, oggetti o consumabili ai personaggi selezionati, con
   anteprima delle singole schede. Il Master decide quantità e destinatari;
   l'app non inventa premi o valori non presenti nel PDF.

Questi strumenti entrano dopo il nucleo PE/PF/Ispirazione/stati. La
consultazione del gruppo e gli appunti sono i primi candidati perché
rispondono a domande frequenti durante la sessione senza introdurre nuovi
automatismi di gioco.

## Dettaglio dei flussi critici

### Danno e guarigione

L'azione rapida chiede quantità e, facoltativamente, tipo e fonte. Nella
prima versione il Master può inserire **danno già determinato al tavolo**;
questo evita di applicare resistenze, vulnerabilità, immunità o riduzioni non
ancora rappresentate nella scheda. La futura modalità «calcola danno» dovrà
mostrare ogni passaggio e l'ordine di applicazione di p. 28. Prima del
salvataggio si vedono PF temporanei e PF attuali prima/dopo.

Il passaggio a 0 PF non viene ridotto a un semplice `max(0, PF - danno)`:
occorre distinguere danno residuo, possibile morte immediata, perdita di
conoscenza e danni ricevuti già a 0 PF (pp. 28–29). Il Master conferma l'esito
quando servono informazioni non presenti nella scheda. Una guarigione da 0 PF
aggiorna gli stati collegati secondo il PDF; i PF temporanei non contano come
guarigione.

### Stati e condizioni

Una condizione normale è presente o assente, ma può avere più fonti e durate.
La vista mostra quale effetto l'ha imposta e quando termina, se noto. Per
Indebolimento registra il livello 0–6 e mostra le penalità previste a p. 366;
non lo tratta come una semplice casella. «Concentrazione» è uno stato distinto
con fonte, effetto e durata: dopo un danno mostra il tiro da effettuare e la
sua CD verificata, senza presumere che il tiro sia fallito (p. 364).

### Riposi

Il PDF descrive il riposo come attività del personaggio, con requisiti e
possibili interruzioni (p. 371); non lo riserva al Master. Il giocatore può
quindi avviare «Riposo breve» o «Riposo lungo» dalla propria scheda,
confermare che il riposo sia stato possibile e completato e compiere le
eventuali scelte, come i Dadi Vita da spendere. Se il riposo avviene durante
una Sessione aperta, l'evento è collegato a quella Sessione e appare subito
nella vista Master. Fuori Sessione resta nello storico del personaggio.
L'app mostra requisiti e possibili interruzioni, ma non inventa ciò che è
accaduto nella finzione: il gruppo e il Master lo stabiliscono al tavolo.

Il Master preme «Riposo breve» o «Riposo lungo» nella Sessione. Per
impostazione iniziale l'operazione include tutti i partecipanti presenti; il
Master può escludere chi non ha riposato. Prima della conferma, una tabella
mostra per **ogni scheda** requisiti soddisfatti, PF, Dadi Vita, PF
temporanei, Indebolimento, slot e risorse prima/dopo. Se un personaggio non
può beneficiare del riposo, non viene modificato e il motivo è visibile.

Il riposo breve chiede quanti Dadi Vita spendere e il risultato di ogni tiro;
non cura automaticamente senza questa scelta. Il riposo lungo verifica i
requisiti di p. 371, ripristina i benefici generali applicabili, termina i PF
temporanei secondo p. 29 e applica soltanto le ricariche di incantesimi e
privilegi verificate nelle rispettive voci. Le interruzioni hanno un flusso
esplicito. La conferma è **una sola operazione di gruppo**: aggiorna tutte
le schede ammesse e scrive un evento per ciascuna, collegato allo stesso
riposo della Sessione. Un errore non lascia metà gruppo aggiornato. La
chiusura della Sessione, da sola, non esegue questo comando.
Il riposo mostra anche le scelte modificabili in quel preciso momento: una
forma conosciuta del Druido può essere sostituita al termine del riposo lungo
(p. 81); il tipo di arma scelto con il talento Maestro d'armi può cambiare
al termine del riposo lungo (p. 206); le due resistenze del Dono della
resistenza all'energia possono cambiare al termine del riposo lungo (p. 211).
Queste scelte sono facoltative, hanno limiti e fonte distinti, e non aprono un
editor libero per `privilegi` o `talenti`. Il riposo aggiorna anche gli usi
spesi delle risorse solo secondo la voce che le concede: per esempio Forma
Selvatica recupera un uso dopo un riposo breve e tutti dopo un riposo lungo
(p. 81); i punti di Fortunato tornano dopo un riposo lungo (p. 201).
L'anteprima mostra ogni scelta, risorsa e competenza influenzata prima/dopo.
Per ogni personaggio con una fonte di Padronanza d'armi che consente un cambio
al termine del riposo lungo, il flusso mostra le armi attualmente scelte e
permette di sostituirne una con un'arma idonea secondo quella fonte. La scelta
è facoltativa: il riposo non cambia automaticamente le Padronanze. Validare
competenza, limiti e fonte sul server, registrare prima/dopo nello storico e
mostrare la scelta anche nell'anteprima del riposo collettivo. Nuovi posti di
Padronanza concessi dal livello appartengono invece al cambio livello; la
pagina Armi resta di sola lettura per competenze e Padronanze.
Per gli incantesimi, il riposo propone soltanto le sostituzioni consentite
dalla classe e dai privilegi posseduti: il Chierico e il Druido possono
rivedere la lista preparata al riposo lungo (pp. 69, 79); il Mago la sceglie
dal proprio libro e può sostituire un trucchetto al riposo lungo (p. 112);
dal 5° livello può sostituire un incantesimo
preparato dal libro anche al riposo breve (p. 113). Paladino, Ranger e
Stregone hanno limiti di sostituzione specifici al riposo lungo (pp. 131,
141, 151); verificare allo stesso modo Cavaliere Mistico e Mistificatore
Arcano (pp. 95, 108). Le sostituzioni del Bardo e del Warlock al cambio
livello non sono offerte come scelta libera al riposo (pp. 59, 165).
L'anteprima distingue incantesimi nel libro, preparati e sempre preparati;
questi ultimi non si rimuovono né occupano posti ordinari. Il Warlock
recupera gli slot della Magia del Patto al riposo breve o lungo (p. 165);
gli altri recuperi seguono la fonte verificata. Validare sul server numero,
lista ammessa, livello degli slot, fonte e momento della scelta, poi registrare
prima/dopo nello storico senza duplicare incantesimi o applicare un riposo
due volte. Gli slot spesi rimangono registrabili durante il gioco nella
scheda; la lista degli incantesimi e la caratteristica di lancio sono di sola
lettura fuori dai flussi guidati.
Il riposo individuale e quello collettivo chiamano **lo stesso motore di
regole e validazione**; un personaggio già incluso in un riposo registrato
non riceve due volte i benefici per un doppio clic o per una schermata
Master rimasta aperta. L'ora dell'ultimo riposo lungo va conservata per
verificare il limite di p. 371.

### Incantesimi acquisiti durante il gioco

Il Mago può trovare un incantesimo da mago di 1° livello o superiore e
copiarlo nel proprio libro quando è di un livello che può preparare e ha
tempo sufficiente: 2 ore e 50 mo per livello dell'incantesimo (p. 113).
Prevedere un flusso individuale «Copia nel libro» distinto da cambio livello
e riposo. Chiedere quale incantesimo è stato trovato, verificare idoneità,
tempo e costo, mostrare l'eventuale spesa di monete e aggiungere la voce con
stato «nel libro» e fonte dell'evento; non prepararla automaticamente.
Se una Sessione è aperta, collegare l'evento alla Sessione e renderlo subito
visibile al Master; fuori Sessione conservarlo nello storico individuale.
Le altre acquisizioni di incantesimi durante il gioco richiedono una fonte
esplicita verificata, non un editor libero nella pagina Incantesimi.

## Dati e integrazione con l'app

- `app/page.tsx` elenca già tutti i personaggi, ma mostra solo nome, classe e
  livello. `lib/db/schema.ts` contiene personaggi e storico; non esistono
  Sessioni, campagne, ruoli o modello di incontro.
- `lib/sheet.ts` salva PE, PF attuali/massimi, Ispirazione, slot spesi,
  risorse e monete. **PF temporanei, Dadi Vita spesi, tiri salvezza contro
  morte e condizioni sono campi ritirati:** `removeRetiredFields` li elimina
  dal salvataggio. Prima di offrire i relativi controlli vanno introdotti
  campi persistenti, validazione e compatibilità con le vecchie schede.
- Aggiungere uno stato di sessione canonico per personaggio: PF temporanei,
  condizioni con fonti/durate, Indebolimento, stato a 0 PF/stabile/morto,
  tiri salvezza contro morte, Dadi Vita spesi e concentrazione. Distinguere
  dati persistenti della scheda, stati temporanei ed effetti derivati; evitare
  due copie concorrenti degli stessi PF o slot.
- Aggiungere entità persistenti per Sessione (`id`, nome, data locale fissata
  alla creazione, `createdAt`, `closedAt`, stato), partecipanti ed eventi.
  Ogni evento ha `sessionId`, `characterId` se pertinente, tipo, ora,
  payload, prima/dopo e riferimento all'eventuale evento corretto. Lo stato
  attuale del personaggio rimane nella scheda canonica; il riepilogo e gli
  snapshot di apertura/chiusura sono copie storiche, non una seconda fonte da
  sincronizzare. Lo storico precedente all'introduzione delle Sessioni
  rimane consultabile come «storico precedente», senza Sessione inventata.
- Ogni pulsante invia un **comando relativo** al server (per esempio
  `assegnaPE(+100)`, `subisciDanno(7)`, `conferisciIspirazione`) con ID
  idempotente, ID di Sessione aperta e valore atteso della versione corrente.
  Il server rilegge Sessione e scheda, valida, calcola e salva nuovo stato,
  evento di Sessione e storico nella stessa transazione.
  In caso di modifica concorrente la UI ricarica e ripropone l'anteprima,
  anziché sovrascrivere silenziosamente la scheda del giocatore.
- Il motore dei riposi è condiviso dai comandi della scheda e della vista
  Master. Il comando individuale può esistere anche senza Sessione aperta;
  quello collettivo richiede una Sessione. Entrambi applicano gli stessi
  requisiti, benefici, ricariche, limiti temporali e regole di idempotenza.
- Registrare nello storico evento, valori prima/dopo, fonte/nota facoltativa
  e provenienza «vista Master». Senza account non attribuire l'evento a una
  persona verificata. Offrire correzione e annullamento espliciti di un
  evento, con nuovo evento di storico, rispettando le modifiche successive.
- La chiusura salva lo stato `chiusa`, l'ora e il riepilogo nella stessa
  transazione e blocca nuovi eventi. Controllare nuovamente lo stato della
  Sessione sul server anche se un client è rimasto aperto; due clic su
  «Chiudi» non creano due chiusure. Le modifiche delle schede già applicate
  non vengono riprodotte una seconda volta alla chiusura.
- Il cambio livello resta affidato a `PLAN_CAMBIO_LIVELLO.md`. La vista Master
  segnala PE sufficienti e apre quel wizard, senza cambiare direttamente il
  livello. Le pagine Talenti e Privilegi restano di consultazione.
- Le creature condivise e gli esemplari della sola Sessione seguono
  `PLAN_CREATURE.md`. La vista Master li mostra tra i partecipanti, collega
  le loro azioni agli eventi della Sessione e distingue il loro stato dalle
  schede dei personaggi giocanti.
- Prima di modificare API o convenzioni Next.js consultare
  `node_modules/next/dist/docs/`. Prima di modificare lo schema o scrivere
  nel database, verificare la destinazione configurata.

## Sequenza di lavoro e dipendenze

1. **Contratto di Sessione e inventario:** definire creazione, data, nome,
   partecipanti, eventi, chiusura e archivio; mappare ogni azione della
   tabella a pagina PDF,
   stato della scheda e validazione. Annotare gli effetti non ancora
   automatizzabili. Confrontare le condizioni con V02 e le risorse con i
   moduli classe, talenti e incantesimi del piano 2024.
2. **Persistenza:** introdurre Sessioni, partecipanti ed eventi; reintrodurre
   in modo persistente i campi necessari sulle schede. Definire migrazione,
   versionamento, normalizzazione, comandi atomici e chiusura idempotente.
   Nessuna scrittura di prova su un database la cui destinazione non sia
   stata verificata.
3. **Prima vista mobile:** apertura e archivio delle Sessioni, elenco di tutti
   i personaggi, riepilogo e azioni PE, PF, Ispirazione, PF temporanei, morte
   e condizioni. Ogni azione è visibile subito nella scheda e nell'evento
   della Sessione. La logica è provata con il PDF. Le azioni che dipendono da
   moduli 2024 ancora aperti sono disabilitate o dichiarate manuali.
4. **Riposi, incantesimi e risorse:** integrarli quando i domini e le logiche
   pertinenti di `PLAN_ADEGUAMENTO_2024.md` sono verificati e collegati
   all'app. Esporre lo stesso flusso di riposo nella scheda individuale e
   nella Sessione del Master; provare ogni ricarica specifica, non soltanto
   il caso generale.
5. **Incontri ed effetti:** tracker di iniziativa/round, concentrazione,
   beni ed effetti temporanei; mantenere distinta la parte libera inserita
   dal Master dalle regole del manuale.
6. **Verifica finale:** simulare creazione, conduzione e chiusura di una
   Sessione su mobile e desktop con modifiche contemporanee dalla scheda e
   dalla vista Master, salvataggi, correzioni, storico ed esportazioni.

## Prove di accettazione

- Il Master vede tutti i personaggi e individua subito chi è a 0 PF, chi ha
  una condizione o Indebolimento, chi possiede Ispirazione e chi è vicino al
  livello successivo. I valori mancanti non appaiono come zero.
- Una nuova Sessione conserva nome e data automatica di creazione. Ogni
  modifica del Master durante la Sessione aperta appare subito nella scheda
  e ha esattamente un evento collegato. Nessuna azione è attribuita a una
  Sessione chiusa o assente.
- PE, Ispirazione, danno, guarigione, PF temporanei, condizioni e tiri
  salvezza contro morte rispettano i casi e i limiti delle pagine citate. I
  casi di morte o di danno a 0 PF non vengono decisi con informazioni mancanti.
- Ogni azione produce un solo aggiornamento e una traccia consultabile;
  doppio clic, ricarica o modifiche simultanee non duplicano né perdono dati.
- La chiusura archivia eventi e riepilogo senza riapplicare le modifiche,
  senza riposo implicito e senza eliminare effetti ancora validi. I dati
  persistenti rimangono nella scheda e gli eventi chiusi non cambiano.
- Un riposo avviato dal Master mostra l'anteprima per ogni partecipante,
  aggiorna insieme tutte le schede ammesse e collega gli eventi alla stessa
  Sessione. Applica solo benefici consentiti e ricariche verificate; risorse
  con recupero diverso restano distinte. I dati personali e le scelte
  permanenti non vengono cancellati.
- Il comando guidato di uso di una risorsa rifiuta capacità non possedute,
  usi esauriti e richieste duplicate. Il riposo propone soltanto le scelte
  modificabili in quel momento, tra cui una forma conosciuta del Druido,
  l'arma del talento Maestro d'armi e le resistenze del Dono della resistenza
  all'energia al riposo lungo; conserva le altre scelte e mostra prima/dopo.
- Il riposo propone solo le sostituzioni di incantesimi consentite dalla
  fonte del personaggio e valida elenco, numero e momento della scelta. Il
  Mago prepara dal proprio libro; gli incantesimi sempre preparati restano
  tali. Gli slot della Magia del Patto del Warlock si recuperano anche al
  riposo breve, senza attribuire lo stesso recupero alle altre classi.
- «Copia nel libro» del Mago registra un incantesimo trovato di livello
  idoneo, tempo e costo di p. 113; aggiunge la voce al libro senza prepararla.
  Un errore o una seconda conferma non duplica l'incantesimo né la spesa.
- Il giocatore può completare un riposo dalla propria scheda con lo stesso
  calcolo. Durante una Sessione il Master vede subito l'evento e la scheda
  aggiornata; fuori Sessione l'evento resta nello storico individuale. Un
  riposo già registrato non viene applicato nuovamente per errore.
- L'interfaccia resta leggibile e usabile con una mano su telefono; l'elenco
  ampio rimane scansionabile su desktop. Nessuna azione rapida modifica
  direttamente classe, livello, talenti o privilegi acquisiti.
