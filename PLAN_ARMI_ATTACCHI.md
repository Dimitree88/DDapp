# Piano — Armi impugnate e attacchi

## Obiettivo e confini

La scheda distingue armi **possedute**, armi **in mano**, scudo impugnato,
competenze e tipi di arma scelti per la **Padronanza**. Un comando rapido
aggiorna cosa il personaggio tiene nelle mani durante il gioco. Un flusso
«Attacca» prepara e registra un singolo attacco con un'arma, mostrando il
calcolo applicabile e consumando soltanto ciò che l'attacco usa davvero.

L'impugnatura non si cambia al riposo: il riposo non altera automaticamente
armi in mano o scudo. Il cambio facoltativo dei tipi di arma scelti per la
Padronanza resta nel flusso di riposo lungo di `PLAN_MASTER_TOOLS.md`; i nuovi
posti e le scelte permanenti restano nel wizard di `PLAN_CAMBIO_LIVELLO.md`.
La chiusura di una Sessione non ripone le armi.

Il primo rilascio può funzionare dalla scheda anche senza una Sessione o un
incontro registrato. Con una Sessione aperta, i comandi aggiornano subito la
scheda e sono collegati alla sua cronologia, come previsto da
`PLAN_MASTER_TOOLS.md`. Il contatore delle azioni, azioni bonus, reazioni e
attacchi disponibili nel turno sarà vincolante soltanto quando esisterà un
incontro con turno e fonti dei privilegi verificati: fuori da quel contesto
l'interfaccia mostra i requisiti, senza fingere di conoscere le azioni già
spese al tavolo.

## Fonte normativa verificata

Unica fonte per regole e dati di gioco:
`docs/regole/Manuale Del Giocatore - 2024.pdf`. Pagine **stampate** lette
direttamente nel PDF per definire questo piano:

| Pagine | Regola pertinente |
| --- | --- |
| 20, 24 | In combattimento c'è una interazione libera con un oggetto durante movimento o azione; una seconda richiede l'azione di Utilizzo. |
| 25–28 | Struttura dell'attacco, copertura, attacchi in mischia e a distanza, gittata normale/lunga, nemico vicino, danni e colpi critici. |
| 203 | Combattente a Due Armi: attacco extra con un'altra arma idonea ed Estrazione rapida, se il personaggio possiede il talento. |
| 205 | Esperto di Balestre: eccezioni a Ricarica, attacchi a distanza ravvicinati e attacco extra condizionato. |
| 206 | Maestro d'Armi: scelta e possibile cambio al riposo lungo; altri talenti modificano attacchi solo alle loro condizioni. |
| 213 | Competenza nelle armi, proprietà A due mani, Accurata, Gittata e Lancio. La seconda mano è necessaria per attaccare con un'arma A due mani. |
| 214 | Leggera, Munizioni, Pesante, Portata, Ricarica, Versatile e le otto proprietà di Padronanza. Munizioni richiede il proiettile adatto e ne consuma uno per attacco; l'estrazione è parte dell'attacco se c'è una mano libera. |
| 215 | Tabella delle armi: dadi, tipi di danno, proprietà, Padronanza, peso e costo. |
| 219 | Lo scudo richiede un'azione di Utilizzo per indossarlo o toglierlo; se competente dà il beneficio alla CA. Una creatura impugna un solo scudo alla volta. |
| 362 | Con l'azione di Attacco si può equipaggiare o riporre un'arma prima o dopo l'attacco; sono definite estrazione, raccolta, rinfoderamento, messa da parte e caduta. |
| 371 | Il riposo ha benefici e requisiti propri; non è un requisito per cambiare arma impugnata. |

Il PDF non formula un divieto generale chiamato «una sola arma per mano».
Modellare due mani e una presa per ciascuna è una scelta dell'interfaccia per
evitare configurazioni fisicamente incoerenti; non attribuirla come citazione
al manuale. L'arma A due mani richiede entrambe le mani **quando si attacca**:
non equiparare automaticamente il semplice trasporto a un attacco con essa.
Prima di automatizzare privilegi di classe, sottoclasse, talenti, armi magiche,
condizioni o incantesimi, leggere direttamente le rispettive voci nel PDF.
Se una voce non chiarisce l'esito, registrare la decisione del tavolo senza
inventare una regola.

## Stato attuale dell'app

- `Sheet.armi` registra nome, quantità, bonus, modo e note, ma non quali
  esemplari siano in mano. `Sheet.equipaggiamento` registra lo scudo
  `impugnato` e `Sheet.scudo` replica il suo stato; la CA usa questo dato.
- La pagina Armi consente già di aggiungere/rimuovere armi e armature e di
  attivare lo scudo. Le armi mostrate come attacchi sono tutte quelle possedute,
  senza indicatore di disponibilità immediata.
- `lib/weaponAttack.ts` calcola un bonus e danno base, ma non risolve una
  dichiarazione di attacco né consuma munizioni. `lib/weaponChoices.ts` e
  `lib/weaponMastery.ts` coprono parti delle scelte e descrizioni delle
  Padronanze. Il codice e i cataloghi sono stato dell'app, non fonte normativa.
- `saveSheet` accetta ancora modifiche dirette dell'inventario. Serve un
  comando specifico per le transizioni di impugnatura e attacco, con controllo
  server e storico; una bozza vecchia non deve sovrascrivere uno stato di
  combattimento aggiornato altrove.

## Modello dei dati e compatibilità

1. Dare un ID stabile a ciascuna voce/istanza di arma posseduta, distinto
   dall'ID del tipo nel catalogo. Due esemplari con lo stesso nome, varianti
   magiche o bonus personali devono poter avere stati diversi. Conservare
   quantità e identità senza trasformare implicitamente una voce aggregata
   in più oggetti magici identici.
2. Conservare l'assetto delle mani sul personaggio: mano principale e mano
   secondaria possono essere libere, riferire un'arma posseduta o lo scudo.
   Prevedere il riferimento alla singola unità quando due copie della stessa
   arma sono impugnate. La vista derivata «arma usabile con due mani» dipende
   dalla disponibilità della seconda mano al momento dell'attacco; la modalità
   Versatile (una o due mani) è una scelta del singolo attacco, non una
   proprietà permanente dell'oggetto.
3. Lo scudo ha un solo stato canonico: migrare e mantenere compatibili
   `equipaggiamento[].impugnato` e `Sheet.scudo` finché i consumatori di CA,
   export e storico usano entrambi. Mai creare due scudi impugnati tramite
   campi discordanti.
4. Distinguere possesso, in mano, riposto e lasciato/caduto. Un'arma lanciata
   esce dalla mano ma non sparisce automaticamente dalla storia del possesso;
   recupero o perdita vengono registrati come eventi espliciti. Consumare la
   quantità delle munizioni appropriate quando l'attacco è effettivamente
   confermato, non quando si apre l'anteprima. Il recupero dopo lo scontro è
   una scelta successiva, secondo la regola verificata a p. 214.
5. Migrare le vecchie schede senza indovinare quali armi fossero impugnate:
   mani inizialmente libere/da confermare, quantità e note conservate, scudo
   posseduto e stato attuale preservati. Non modificare Padronanze o bonus
   manuali nel passaggio. Verificare la destinazione del database prima di
   scritture o modifiche di schema.

## Interfaccia mobile

- In cima alla pagina Armi, due riquadri «Mano principale» e «Mano
  secondaria» mostrano arma, scudo o «Libera». Mostrare separatamente
  armatura indossata, armi possedute e Padronanze scelte. La lista degli
  attacchi distingue «Pronta», «Riposta» e «Richiede una mano libera»; nessun
  numero di attacco viene nascosto solo perché l'arma è riposta.
- Comandi rapidi «Impugna», «Riponi», «Lascia cadere», «Raccogli» e «Cambia»
  mostrano in anteprima mani prima/dopo ed eventuale costo nell'incontro.
  Per lo scudo mostrare l'azione di Utilizzo prevista a p. 219; per le armi
  considerare p. 24 e p. 362, e l'eventuale Estrazione rapida solo se posseduta.
  Fuori da un incontro, l'utente registra il nuovo stato senza simulare turni.
- Non permettere di impugnare un'arma non posseduta, un'unità già assegnata
  all'altra mano o una quantità superiore alle unità disponibili. Non
  rimuovere l'ultima unità di un'arma in mano senza prima scegliere cosa ne
  accade. Un'arma A due mani può essere tenuta, ma l'azione «Attacca a due
  mani» segnala o risolve l'occupazione della seconda mano prima del tiro.
- Riepilogo compatto dei tiri per colpire e dei danni, con formula, fonte,
  proprietà, gittata, munizioni disponibili e Padronanza attiva. Rendere
  leggibile perché una competenza o un effetto si applica. Mantenere
  accessibile la scheda completa dell'arma tramite il nome.

## Flusso «Attacca»

1. Scegliere l'arma/istanza o il colpo senz'armi, il tipo di attacco consentito
   (mischia, distanza o lancio), e per Versatile la presa del singolo colpo.
   L'arma deve essere disponibile nella configurazione corrente oppure il
   flusso deve includere una transizione di equipaggiamento lecita e visibile.
   Un colpo senz'armi ha regole proprie da verificare prima di implementarlo.
2. Mostrare tiro per colpire e danno base derivati da caratteristica,
   competenza, proprietà e bonus effettivi. La competenza aggiunge il bonus
   al tiro per colpire, non rende impossibile usare l'arma. Mostrare le
   condizioni che dipendono dal bersaglio: distanza e gittata, copertura,
   vantaggio/svantaggio, resistenze, immunità e vulnerabilità. Senza dati del
   bersaglio non attribuire un esito certo.
3. Gestire le proprietà della tabella Armi: A due mani, Accurata, Gittata,
   Lancio, Leggera, Munizioni, Pesante, Portata, Ricarica e Versatile.
   Distinguere il tiro per colpire dal consumo: un attacco con Munizioni
   consuma una munizione anche se manca; il lancio sposta l'arma dalla mano.
   Segnalare l'eventuale impossibilità di caricare per mancanza di mano libera
   o munizioni, e le eccezioni effettivamente possedute.
4. Separare «Dichiara», «Tiro/esito» e «Applica». Registrare d20 normale,
   vantaggio o svantaggio e modificatori contestuali; l'esito del colpo può
   essere inserito dal tavolo o calcolato quando CA e condizioni affidabili
   sono note. Su colpo riuscito mostrare dadi e modificatori di danno;
   sul critico raddoppiare i dadi pertinenti, non i modificatori. L'applicazione
   dei danni a un bersaglio con scheda gestita è un comando distinto,
   coordinato con `PLAN_MASTER_TOOLS.md` e `PLAN_CREATURE.md`; non duplicare
   PF o condizioni in questo flusso.
5. Offrire attacchi aggiuntivi da Leggera, Graffio, Attacco Extra, talenti,
   privilegi, azione bonus o reazione solo quando fonte e prerequisiti sono
   registrati e verificati. L'attacco aggiuntivo è un nuovo evento collegato,
   con propria arma, tiro, bersaglio, munizione e danno. Non inferire che
   impugnare due armi conceda automaticamente qualunque attacco aggiuntivo.
6. Applicare le proprietà di Padronanza solo se il tipo di arma è tra quelli
   scelti dal personaggio e la fonte lo consente. Distinguere effetti al
   colpire, al mancare, dopo danni, opzioni facoltative, tiri salvezza e
   durata; chiedere bersaglio ed esito quando necessari. Rispettare i limiti
   per turno soltanto con un turno registrato. Le scelte di Padronanza al
   riposo o al livello non avvengono qui.
7. Confermare in una sola operazione l'assetto delle mani, i consumi e
   l'evento di attacco. Un annullamento lascia tutto invariato. Una
   correzione successiva è un evento motivato che ripristina o rettifica i
   consumi senza cancellare la cronologia originale.

## Server, integrazioni e ordine di lavoro

- Il cliente invia un comando relativo (arma/istanza, modalità, scelta e ID
  del comando), non l'intero nuovo `Sheet` come autorità. Il server rilegge
  scheda, inventario, competenze, Padronanze e contesto di Sessione/incontro;
  valida, applica e registra prima/dopo in una transazione. Doppio tocco,
  ritento e due dispositivi non possono consumare due volte l'ultima
  munizione o sovrascrivere una mano aggiornata. Se la versione è cambiata,
  ricaricare l'anteprima.
- Aggiornare calcolo della CA e warning dello scudo quando la mano cambia.
  Aggiornare storico, export PDF e riepilogo Master in modo che mostrino
  possesso e impugnatura come dati distinti. Le formule di attacco restano
  disponibili per consultazione anche per le armi riposte.
- Coordinare con `PLAN_LANCIO_INCANTESIMI.md` gli incantesimi che richiedono
  un attacco con arma e gli eventuali requisiti delle mani. Verificare nel PDF
  ciascun incantesimo e le regole dei componenti prima di automatizzare
  interferenze con arma, scudo o focus; il lancio non deve aggirare i vincoli
  dell'assetto delle mani.
- Introdurre in ordine: **(1)** identità e migrazione delle armi, assetto
  delle mani e validazione; **(2)** comandi di impugnatura/scudo e UI mobile;
  **(3)** calcolo contestuale e flusso di attacco base con munizioni/lancio;
  **(4)** attacchi aggiuntivi e Padronanze verificati; **(5)** aggancio a
  incontro, bersagli, PF ed effetti temporanei. Ogni fase deve lasciare
  coerenti scheda, storico ed export, senza presentare come automatici gli
  effetti della fase successiva.

## Prove di accettazione

- Una vecchia scheda conserva inventario, note, scudo e CA; le armi in mano
  non vengono indovinate. Due copie dello stesso pugnale possono essere
  assegnate a mani diverse solo se la quantità lo permette.
- Spadone e scudo possono figurare nell'inventario; l'attacco con lo spadone
  richiede due mani disponibili nel momento del colpo. Una spada versatile
  mostra il dado corretto in ciascuna presa. Togliere o indossare lo scudo
  aggiorna CA e mostra il costo previsto.
- Due armi leggere, una sola arma leggera, Combattente a Due Armi e Graffio
  propongono soltanto gli attacchi extra consentiti dalla rispettiva fonte.
  Una Padronanza conosciuta ma non scelta non applica la sua proprietà.
- Attacco con arco senza frecce, balestra con Ricarica, lancio dell'ultima
  arma in mano, gittata lunga, bersaglio vicino, copertura e critico mostrano
  il risultato/avviso pertinente senza consumi anticipati.
- Cambio arma durante il gioco, riposo breve/lungo, cambio livello e chiusura
  Sessione mantengono distinte impugnatura, Padronanza e inventario. Il riposo
  non impugna né ripone armi.
- Un attacco annullato, un doppio tocco e due comandi concorrenti non
  producono consumi o eventi duplicati. Lo storico consente di ricostruire
  quale arma e quale stato delle mani erano presenti per ogni attacco.
