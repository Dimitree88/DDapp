# Piano per il wizard di cambio livello

## Obiettivo e decisioni

Un tocco sulla freccia ↑ accanto al livello apre la conferma di avanzamento. Il
wizard porta il personaggio **di un livello alla volta**, applica le conseguenze
certe e chiede soltanto le scelte previste dalle regole. Fino alla conferma
finale lavora su una bozza: annullare non cambia la scheda. La conferma salva
una sola modifica coerente e una voce di storico.

Decisioni dell'utente del 6 ottobre 2026:

- Le pagine **Talenti** e **Privilegi** mostrano quanto acquisito, con fonte,
  livello, testo e scelte effettuate. Non hanno pulsanti per aggiungere o
  rimuovere liberamente voci, né campi per correggere direttamente scelte o
  risorse. Anche gli usi spesi delle risorse richiedono un comando guidato
  durante il gioco. Il wizard di creazione e quello di avanzamento raccolgono
  le scelte permanenti.
- Il cambio livello può essere avviato anche se i PE registrati sono inferiori
  alla soglia della tabella. In questo caso il wizard mostra soglia e PE attuali
  e richiede una conferma esplicita aggiuntiva. È una scelta del flusso
  dell'app; non viene presentata come regola del manuale. I PE non vengono
  aumentati automaticamente.
- Il primo rilascio copre l'avanzamento nella **classe già registrata**. La
  multiclasse è una fase distinta: oggi `Sheet` registra una sola classe e un
  solo livello. Il wizard non deve simulare la multiclasse usando il livello
  totale come livello di classe.
- Il Livello è già in sola lettura nella scheda: `saveSheet` rifiuta modifiche
  dirette. Finché il wizard non sarà pronto, non esiste un comando per
  avanzare; il futuro cambio livello userà una transizione dedicata e atomica.
- PF massimi, Dadi Vita e Velocità non si modificano più direttamente dalla
  scheda. Il cambio livello o l'evento che li altera deve mostrare fonte,
  calcolo e valore prima/dopo. L'Allineamento è scelto alla creazione e,
  secondo la decisione dell'utente del 6 ottobre 2026, non si modifica più
  dalla scheda dopo la creazione.
- I sei punteggi di caratteristica e le competenze nei tiri salvezza sono in
  sola lettura nella pagina Caratteristiche. Le scelte permanenti ottenute
  avanzando si applicano nel wizard, con fonte e limiti verificati. Gli effetti
  eccezionali durante il gioco (per esempio *Desiderio*, p. 265) sono gestiti
  manualmente dalle persone al tavolo e non richiedono un automatismo nell'app.
- Le spunte di competenza e Maestria nella pagina Abilità sono indicatori in
  sola lettura. La creazione deve raccogliere tutte le scelte iniziali, senza
  consentire di completarle dalla scheda in un secondo momento. Il wizard di
  avanzamento raccoglierà le nuove scelte concesse da privilegi e talenti.
- Decisione successiva: per ora la Velocità resta soltanto leggibile. Non
  introdurre comandi manuali per variarla; il wizard la aggiornerà solo se
  il nuovo livello concede un effetto permanente verificato. Gli altri
  effetti sulla velocità richiedono una futura funzione dedicata.
- I talenti bonus successivi al 20° livello descritti a p. 43 restano fuori da
  questo wizard, come richiesto dall'utente.

## Fonte normativa verificata

Unica fonte per ogni regola e dato di gioco:
`docs/regole/Manuale Del Giocatore - 2024.pdf`. Pagine **stampate** controllate
direttamente nel PDF per questo piano:

| Pagine | Contenuto pertinente |
| --- | --- |
| 27 | Distinzione fra PF attuali e PF massimi; danni e guarigione modificano i PF attuali. |
| 40 | Registrazione dei privilegi di classe di 1° livello e delle scelte offerte. |
| 41 | PE, livelli 1–20, bonus di competenza, incantesimi, trucchetti e slot indicati dalle tabelle di classe. |
| 42 | Sequenza di avanzamento: classe, PF e Dado Vita, nuovi privilegi e scelte, bonus di competenza, modificatori di caratteristica. Valore tirato o fisso dei PF; incremento dei PF massimi quando aumenta il modificatore di Costituzione. |
| 43 | Creazione a livello superiore e caso opzionale dei talenti dopo il 20° livello, escluso dal primo rilascio. |
| 42–43 | La sequenza ordinaria di avanzamento non concede equipaggiamento di partenza aggiuntivo; la tabella di equipaggiamento per livelli superiori riguarda la creazione e lascia al DM la decisione sull'equipaggiamento extra. |
| 44–45 | Multiclasse: prerequisiti, livelli per classe, competenze, Dadi Vita, privilegi e incantesimi; base per la fase separata. |
| 59, 69, 79, 95, 108, 111–113, 131, 141, 151, 165 | Progressioni di incantesimi, trucchetti, preparazione, libro del mago e momenti di sostituzione differenti per classe e sottoclasse: verificare ciascun testo e tabella prima di applicare concessioni o scelte. |
| 204, 219 | Corazze Leggere, Corazze Medie e Corazze Pesanti conferiscono competenze, non oggetti. Possedere, indossare e saper usare armature o scudi sono stati distinti. |
| 87, 168 | Il Circolo delle Stelle al 3° livello ha creato una Carta Celeste, oggetto con aspetto scelto o tirato; se viene persa, può crearne un'altra con un rituale. Il Libro delle Ombre del Patto del Tomo è invece evocato dopo un riposo e scompare quando viene evocato un altro libro o muore il warlock: distinguere gli oggetti acquisiti da quelli evocati e temporanei. |
| 37–40 | Allineamento scelto durante la creazione; taglia e velocità base determinate dalla specie. Il PDF non descrive un normale cambio di Allineamento dopo la creazione. |
| 186–197 | Tratti delle specie da cui deriva la velocità base; la Robustezza nanica aumenta i PF massimi al livello. |
| 202 | Il talento Robusto aumenta i PF massimi subito e a ogni livello successivo. |
| 137, 211, 301 | Esempi di velocità modificata rispettivamente da privilegio di classe, talento e incantesimo; non sono modifiche libere della scheda. |
| 219 | Un'armatura con requisito di Forza non soddisfatto riduce la velocità di 3 metri. |
| 37, 101, 142 | Alla creazione: Comune e due lingue standard scelte o tirate. Il Ladro ottiene Gergo Ladresco e una lingua scelta al 1° livello; il Ranger sceglie due lingue con Esploratore Esperto al 2° livello. |
| 51–52 | Esempio di tabella di classe, privilegio con risorsa, sottoclasse, talento concesso da un privilegio. |
| 177, 197, 199 | Talento conferito dal background; talento di Origini aggiuntivo dell'Umano; categorie, prerequisiti e ripetibilità dei talenti. |
| 70, 80, 201–202 | Ordine divino e Ordine primordiale richiedono una scelta al 1° livello; Iniziato alla magia ha una sostituzione quando si acquisisce un livello, mentre Lavoro manuale e Musicista concedono scelte di strumenti. |
| 12, 36, 38, 40 | Il tiro salvezza somma il bonus di competenza solo se la competenza è posseduta; alla creazione si scelgono i punteggi e si registrano le competenze conferite. |
| 53, 103, 125, 145 | Esempi di privilegi di classe che aumentano punteggi o conferiscono competenza nei tiri salvezza a livelli specifici. |
| 199, 203, 208 | I talenti possono aumentare i punteggi; Resiliente conferisce anche competenza nel tiro salvezza scelto. |
| 13–14, 36, 101–102, 202 | Le competenze nelle abilità iniziali derivano dalla creazione; classe e background concedono competenze, mentre privilegi e talenti specifici possono conferire competenza o Maestria. Il bonus numerico dipende dal modificatore e dal bonus di competenza. |

Le tabelle e le regole di **ogni classe e sottoclasse**, di ogni talento e di
ogni incantesimo interessato andranno verificate sulle rispettive pagine del
PDF durante l'implementazione. Il codice e i JSON esistenti descrivono lo
stato attuale dell'app, non sostituiscono il PDF.

## Esperienza mobile

1. Nella pagina Stato, il livello è leggibile e non si modifica digitando un
   numero. Una freccia ↑ separata e accessibile apre «Passa dal livello N al
   livello N+1?». Al 20° livello la freccia non propone il livello 21.
2. Il popup iniziale mostra classe, livello di arrivo, PE attuali e soglia del
   manuale. Se i PE sono sotto soglia, presenta l'avviso e la conferma
   aggiuntiva scelta dall'utente. Chiudere il popup non modifica niente.
3. Il wizard crea una **bozza** e compone le tappe in base alla classe e al
   livello di arrivo. Mostra una tappa solo quando è pertinente: PF, eventuale
   sottoclasse, privilegi con scelte, talenti, caratteristiche, competenze,
   padronanze e incantesimi. Il giocatore può tornare indietro senza perdere
   le risposte della bozza.
4. Ogni scelta mostra opzioni ammesse, fonte, pagina del manuale e beneficio
   completo. Le opzioni non disponibili spiegano il requisito mancante.
   Nessuna scelta obbligatoria viene compilata arbitrariamente.
5. Il riepilogo distingue «applicato automaticamente», «scelto dal giocatore»
   e «da gestire durante il gioco». Mostra prima/dopo per ogni cambiamento
   concesso dal nuovo livello, inclusi PF massimi, Dadi Vita, caratteristiche,
   privilegi, talenti, incantesimi, lingue, oggetti, monete, competenze,
   risorse e valori derivati. Ogni voce riporta fonte e pagina; le formule
   sono quelle realmente applicate.
6. «Conferma cambio livello» è disponibile solo con tutte le scelte
   obbligatorie valide. Un solo salvataggio atomico aggiorna la scheda e lo
   storico. Un errore lascia la bozza aperta; un secondo clic non crea un
   secondo livello. Dopo il salvataggio, Talenti e Privilegi mostrano le nuove
   voci e le scelte effettuate.
7. Dopo il salvataggio, aprire un riepilogo mobile con il titolo «Sei passato
   al livello X! Ecco le novità:» e una lista puntata di tutte le voci
   aggiunte, modificate o rimosse da quel passaggio, comprese le conseguenze
   delle scelte effettuate. Ogni punto usa parole comprensibili al giocatore;
   per un valore modificato mostra prima e dopo, e rende consultabili fonte e
   pagina. Se una capacità nuova richiede un'azione durante il gioco, dirlo
   esplicitamente senza presentarla come oggetto o effetto già applicato. Un
   indicatore «Novità» resta sulla scheda finché il riepilogo non viene letto;
   lo stesso evento si può riaprire dallo storico. Un salvataggio fallito non
   genera né notifica né indicatore.

## Effetti da valutare a ogni livello

La tabella è una **checklist del motore**, non un elenco di concessioni uguali
per tutte le classi. Ogni diritto e limite viene dalla tabella e dal testo
verificato della classe, sottoclasse, talento o incantesimo pertinente.

| Ambito | Automatico o richiesta al giocatore |
| --- | --- |
| Livello e PE | Aumentare di 1 il livello solo al salvataggio. Conservare i PE registrati; mostrare la soglia e l'eventuale conferma sotto soglia. |
| PF massimi e Dadi Vita | Aggiungere un Dado Vita del tipo della classe. Chiedere tiro del dado oppure valore fisso della tabella; sommare Costituzione, rispettando il minimo indicato. Conservare metodo e risultato per quel livello. Ricalcolare i PF massimi se il modificatore di Costituzione cambia, includendo l'incremento per i livelli già acquisiti. Applicare incrementi verificati di specie, talenti e privilegi (per esempio Robustezza nanica e Robusto); distinguere Dadi Vita totali e Dadi Vita spesi. Nessuna modifica diretta ai due massimi nella scheda. |
| Privilegi | Conferire quelli previsti al nuovo livello dalla classe e dalla sottoclasse già scelta. Mostrare le decisioni che richiedono: sottoclasse, opzioni interne, competenze, padronanze, lingue o altre scelte effettivamente presenti nel testo. Non duplicare un privilegio già conferito. Creare o aggiornare le risorse con massimo, fonte e ricarica verificati, conservando gli usi già spesi; il cambio livello non è un riposo. Le scelte iniziali di 1° livello, come Ordine divino e Ordine primordiale (pp. 70, 80), devono essere complete già alla creazione, senza un editor tardivo nella scheda. |
| Lingue | Nessuna aggiunta libera dalla scheda. Alla creazione registrare Comune e le due lingue standard scelte o tirate, con fonte. Ai livelli successivi aggiungere una lingua solo quando un privilegio verificato lo concede; chiedere la scelta soltanto dall'elenco consentito e registrare fonte, livello e pagina. Per il primo rilascio verificare almeno Esploratore Esperto del Ranger al 2° livello; le concessioni del Ladro e del Druido al 1° livello appartengono alla creazione. Le note sulle lingue restano testo personale modificabile. |
| Talenti | Quando un privilegio concede un talento, creare una scelta vincolata alla sua fonte: categoria, prerequisiti e ripetibilità verificati. Registrare anche le scelte interne al talento e applicare i suoi effetti soltanto dove l'app li calcola davvero. Verificare a ogni livello le opzioni di talenti già posseduti: Iniziato alla magia permette di sostituire uno degli incantesimi scelti quando si ottiene un nuovo livello (p. 201). La scelta della lista e della caratteristica di lancio fatta all'acquisizione non diventa liberamente editabile. |
| Caratteristiche e competenza | Applicare gli incrementi scelti tramite il talento o privilegio pertinente, con limiti e requisiti verificati. Conferire o scegliere competenze nei tiri salvezza solo quando la classe, un privilegio o un talento lo prevede (per esempio Resiliente). Registrare la fonte e non confondere la competenza con il bonus numerico, che può aumentare per livello. Ricalcolare i modificatori e il bonus di competenza del nuovo livello; non salvare copie ridondanti dei valori derivabili. |
| Abilità e Maestria | Applicare competenze e Maestria soltanto se una classe, un privilegio o un talento li concede. Chiedere l'abilità quando la fonte prevede una scelta; conservarne fonte e livello. Aggiornare i bonus delle abilità dal punteggio di caratteristica e dal bonus di competenza, senza editarli o assegnare spunte arbitrarie. |
| Competenze nelle armature e negli scudi | Applicare le competenze concesse dal talento o privilegio acquisito, con fonte e requisiti verificati. Per esempio, Corazze Leggere concede competenza nelle armature leggere e negli scudi; non aggiunge oggetti all'inventario e non li equipaggia. |
| Calcoli dipendenti | Aggiornare i risultati realmente calcolati: tiri salvezza, abilità e Maestria, iniziativa, percezione passiva, attacchi e danni, CA, velocità, capacità, CD e attacchi degli incantesimi. Per la velocità distinguere base della specie, variazioni permanenti da livello/talento e variazioni da equipaggiamento, condizioni, privilegi o incantesimi durante il gioco; aggiornare il valore solo tramite l'evento pertinente. Ogni effetto non implementato va indicato come da gestire in un flusso guidato, senza dichiararlo applicato. |
| Incantesimi | Usare la progressione della classe e i privilegi acquisiti per determinare trucchetti, incantesimi preparati o sostituibili, incantesimi nel libro, livello accessibile, slot e risorse di lancio. Chiedere soltanto le scelte previste in quel passaggio; conservare fonte, stato (nel libro, preparato, sempre preparato o concesso), caratteristica da incantatore, livello di acquisizione e pagina di ciascun incantesimo. Registrare le sostituzioni permesse al cambio livello (per esempio Bardo e Warlock) senza offrire quelle riservate al riposo. Un incantesimo sempre preparato non occupa uno dei posti di preparazione ordinari e non si rimuove come libera scelta. I nuovi massimi degli slot non azzerano gli slot già spesi: il cambio livello non è un riposo. Non usare le attuali tabelle SRD come fonte normativa. |

| Risorse e stato di gioco | Adeguare i massimi e aggiungere le nuove risorse previste; mantenere tracciabili utilizzi già spesi, PF attuali e slot già spesi. Il cambio livello da solo non ripristina PF o risorse: le pp. 27 e 42 distinguono i PF attuali dal loro massimo e indicano l'aumento del massimo, senza prescrivere una guarigione. Applicare eventuali variazioni dei PF attuali solo quando la regola specifica lo dice. I casi non determinabili dal PDF o dalla scheda richiedono una scelta esplicita prima dell'implementazione. |
| Dati personali ed equipaggiamento | Conservare note, oggetti, quantità, monete, armatura indossata e scudo impugnato. Il solo cambio livello, anche quando conferisce competenza nelle armature o negli scudi, non aggiunge né equipaggia un oggetto. Risolvere anche gli effetti degli eventuali talenti e privilegi appena acquisiti: quando il testo verificato concede un oggetto fisico persistente, aggiungerlo una sola volta all'inventario con quantità, scelta, fonte, livello e pagina; chiedere le scelte necessarie (per esempio l'aspetto della Carta Celeste del Druido del Circolo delle Stelle al 3° livello, p. 87). Non inventare peso o costo mancanti. Oggetti evocati, temporanei o creati durante il gioco non diventano automaticamente voci permanenti dell'inventario; in mancanza di una concessione esplicita, l'acquisizione resta nel normale inventario di gioco. |

### Scelte di incantesimi nell'avanzamento

- Per ogni classe e sottoclasse verificare direttamente nel PDF numero di
  trucchetti, incantesimi preparati, incantesimi nel libro, livelli accessibili,
  slot e ricariche. Distinguere «aggiunto al repertorio/libro», «preparato» e
  «sempre preparato», con fonti e limiti indipendenti. Il wizard chiede le
  scelte necessarie prima di salvare e non inventa incantesimi mancanti.
- Applicare le sostituzioni previste proprio dal nuovo livello, come quelle
  del Bardo (p. 59) e del Warlock (p. 165). Le modifiche consentite al riposo
  appartengono al flusso di riposo di
  `PLAN_MASTER_TOOLS.md`; copiare un incantesimo trovato nel libro del mago
  durante il gioco è un evento distinto (p. 113).
- Risolvere anche gli incantesimi concessi da talenti, privilegi e sottoclassi,
  comprese le scelte interne e la caratteristica da incantatore prevista dalla
  fonte. Una caratteristica può essere scelta solo se il testo lo consente.
  Conservare e mostrare gli slot spesi già registrati; i massimi e i livelli
  degli slot derivano dalle tabelle del PDF, non da `lib/spellcasting.ts` o dai
  cataloghi SRD attuali senza riconciliazione.

| Fonte | Scelte al cambio livello | Scelte riservate al riposo |
| --- | --- | --- |
| Bardo (p. 59) | Nuovi incantesimi quando cresce la capienza; può sostituirne uno preparato e un trucchetto. | Nessuna sostituzione generale della lista preparata per il solo riposo. |
| Chierico e Druido (pp. 69, 79) | Nuovi incantesimi quando cresce la capienza; può sostituire un trucchetto. | Può rivedere la lista preparata al riposo lungo. |
| Mago (pp. 111–113) | Due nuovi incantesimi nel libro a ogni livello da mago dopo il primo; nuovi posti di preparazione e trucchetti ai livelli indicati dalla tabella. | Può rivedere la lista preparata e sostituire un trucchetto al riposo lungo; dal 5° livello può sostituire un preparato dal libro dopo un riposo breve. |
| Paladino e Ranger (pp. 131, 141) | Nuovi incantesimi quando cresce la capienza. | Può sostituire un preparato al riposo lungo. |
| Stregone (p. 151) | Nuovi incantesimi quando cresce la capienza; può sostituire un trucchetto. | Può sostituire un preparato al riposo lungo. |
| Warlock (p. 165) | Nuovi incantesimi quando cresce la capienza; può sostituire un preparato e un trucchetto. | Recupera gli slot della Magia del Patto al riposo breve o lungo; nessuna sostituzione generale della lista per il solo riposo. |
| Cavaliere Mistico e Mistificatore Arcano (pp. 95, 108) | Seguire le rispettive tabelle di sottoclasse per nuovi incantesimi e trucchetti; il Mistificatore può sostituire un trucchetto diverso da *mano magica* quando ottiene un livello. | Ciascuno può sostituire un preparato al riposo lungo; verificare ogni altra opzione dal testo della sottoclasse. |

La matrice descrive il momento delle scelte, non sostituisce i conteggi delle
tabelle di classe né le concessioni di talenti, privilegi e sottoclassi. Le
scelte speciali di questi ultimi si sommano solo quando la loro voce PDF lo
prevede, con fonte distinta.

### Completezza delle concessioni

- Per ogni passaggio e opzione selezionata, seguire tutta la catena delle
  concessioni: classe, sottoclasse, privilegi, talenti e scelte interne.
  Applicare ogni effetto permanente previsto dal testo verificato, qualunque
  sia il campo della scheda: lingue, monete, oggetti, competenze, punteggi,
  massimi, incantesimi, risorse, calcoli o altri dati pertinenti. Per esempio,
  Esploratore Esperto del Ranger al 2° livello richiede due lingue e una scelta
  di Maestria (p. 142); non basta registrare il nome del privilegio.
- Registrare per ciascun effetto tipo, quantità o variazione, scelta, fonte,
  livello e pagina PDF. Se il testo richiede una scelta, chiederla al giocatore;
  non assegnare arbitrariamente oggetti, monete o altre ricompense. Il cambio
  livello da solo non aumenta PE o monete e non consegna equipaggiamento.
- Classificare ogni effetto della matrice classe/livello come applicato,
  scelta obbligatoria o capacità da usare durante il gioco. Una concessione
  permanente non modellata o senza fonte verificata impedisce di dichiarare
  completo quel passaggio del wizard: non deve sparire dal riepilogo né
  apparire come applicata.

### Aggiornamento dei quattro campi bloccati

1. **PF massimi:** partire dal valore persistito e mostrare il valore prima
   dell'avanzamento. Al nuovo livello chiedere tiro del Dado Vita o scelta del
   valore fisso; sommare il modificatore di Costituzione con il minimo di 1 PF
   guadagnato. Applicare gli incrementi per i livelli già acquisiti se il
   modificatore di Costituzione cambia, e quelli di specie, talenti o privilegi
   solo quando la relativa voce verificata li prevede. Salvare metodo, esito,
   fonti e totale nuovo; non inventare tiri storici mancanti.
2. **Dadi Vita totali:** aggiungere esattamente un dado del tipo della classe
   per il livello acquisito. Registrare separatamente i dadi già spesi: il
   cambio livello non equivale a un riposo. La multiclasse resta fuori dal
   primo rilascio e richiederà i dadi delle rispettive classi.
3. **Velocità:** mantenere il valore registrato se il nuovo livello non
   conferisce un effetto pertinente. Se classe, sottoclasse o talento scelto
   concede un incremento permanente, applicarlo solo dopo verifica della
   voce nel PDF e mostrarne fonte e calcolo nel riepilogo. Non offrire un
   campo editabile né un comando manuale per effetti temporanei,
   equipaggiamento o altre variazioni in questa fase.
4. **Allineamento:** conservarlo senza variazioni nel cambio livello. È una
   scelta della creazione, non una ricompensa o un valore derivato dal livello.

Le opzioni che un privilegio permette di **cambiare durante il gioco** (per
esempio dopo un riposo) non diventano modifiche libere nella pagina
Privilegi: avranno un flusso guidato distinto dal cambio livello.

## Dati e motore

- Sostituire l'attuale modifica diretta di `sheet.livello` in
  `app/personaggio/[id]/CharacterClient.tsx` con l'ingresso al wizard.
- Conservare in sola lettura punteggi e competenze nei tiri salvezza nella
  pagina Caratteristiche. `saveSheet` rifiuta variazioni dirette a punteggi,
  spunte e fonti delle competenze nei tiri salvezza. Il wizard applica le
  concessioni permanenti e registra la relativa fonte.
- Conservare in sola lettura le spunte di competenza e Maestria nella pagina
  Abilità. `saveSheet` rifiuta ogni variazione delle abilità e delle loro
  fonti. La creazione completa le scelte iniziali; il wizard userà una
  transizione dedicata per le concessioni ai livelli successivi.
- Mantenere PF massimi, Dadi Vita totali, Velocità e Allineamento in sola
  lettura nella scheda. `saveSheet` deve rifiutare le modifiche dirette a
  questi campi; il wizard userà una transizione dedicata, verificata sul
  server. Gli altri eventi avranno transizioni dedicate in una fase successiva.
  L'Allineamento si raccoglie nel flusso di creazione e non è
  un effetto del cambio livello.
- Mostrare le lingue conosciute in sola lettura e lasciare modificabili solo
  le note. `saveSheet` rifiuta variazioni dirette a `lingue`; creazione e
  avanzamento useranno transizioni dedicate che verificano fonte, numero di
  scelte e insieme di lingue ammesse. Riconciliare le schede pregresse senza
  eliminare lingue storiche prive di fonte certa.
- Mostrare gli incantesimi e la caratteristica di lancio in sola lettura nella
  scheda ordinaria. `saveSheet` rifiuta modifiche dirette a `incantesimi`;
  `slotSpesi` resta il conteggio modificabile dell'uso durante il gioco, con
  limite al massimo verificato. Creazione, avanzamento, riposo e acquisizioni
  durante il gioco useranno transizioni dedicate con fonte e momento validati.
  Riconciliare le voci pregresse senza fonte o stato certo senza cancellarle.
- Le pagine Privilegi e Talenti mostrano voci e scelte registrate in sola
  lettura. `saveSheet` rifiuta variazioni dirette a `privilegi`, `talenti`,
  `risorse`, competenze negli strumenti e fonti delle competenze. Il wizard
  aggiorna queste voci tramite la concessione verificata; l'uso e il recupero
  delle risorse appartengono ai comandi guidati della Sessione e del riposo.
  Le competenze concesse da Lavoro manuale o Musicista (pp. 201–202) devono
  essere riconciliate con le scelte del talento, rimuovendo una vecchia fonte
  quando una transizione valida sostituisce una scelta e senza aggiungere
  competenze duplicate.
- Per PF massimi e velocità conservare separatamente valore base, fonti e
  variazioni applicabili, inclusi gli effetti temporanei e la loro scadenza.
  I Dadi Vita totali derivano dai livelli nelle classi; quelli spesi sono
  stato di gioco distinto. Il wizard applica le variazioni permanenti del
  nuovo livello; equipaggiamento e altri effetti richiederanno flussi evento
  distinti in una fase successiva, senza editor manuale della Velocità.
- Introdurre un modello di **concessione** con ID stabile, fonte
  (`classe`, `sottoclasse`, `background`, `specie`, `talento`), livello di
  acquisizione, riferimento alla voce del manuale e scelte richieste.
  Un talento scelto deve riferirsi alla concessione che lo ha permesso.
- Risolvere le concessioni in catena (livello → classe/sottoclasse → privilegio
  o talento scelto → effetti), includendo tutti i dati persistenti concessi.
  Ogni effetto applicato conserva l'ID della concessione che lo ha prodotto,
  oltre a scelta, quantità o variazione e riferimento PDF. La stessa
  concessione non si applica due volte se il wizard viene riaperto o
  confermato di nuovo.
- Conservare separatamente: dati normativi del PDF, concessioni derivate,
  risposte del giocatore, valori calcolati e stato corrente delle risorse.
  Registrare per livello il dado/valore fisso dei PF e le decisioni che non si
  possono ricostruire dalla sola scheda finale. Evitare copie dei testi del
  manuale nelle schede salvate.
- Persistire con ogni transizione di livello un manifesto dei cambiamenti:
  concessione originaria, categoria, prima/dopo, descrizione leggibile,
  pagina e stato «applicato», «scelto» o «da usare durante il gioco».
  Registrare l'ID dell'evento letto per mantenere l'indicatore «Novità»
  corretto dopo ricaricamento, senza creare notifiche duplicate.
- Una funzione pura prepara da scheda + nuovo livello + dati verificati le
  concessioni, le scelte mancanti e l'anteprima. Un'altra applica una bozza
  completa e valida. Rieseguire la preparazione non deve aggiungere duplicati.
- Validare sul server la transizione **N → N+1**, classe, requisiti e scelte
  contro la versione persistita. Rileggere la scheda prima del commit e
  rifiutare una bozza obsoleta se un altro salvataggio l'ha cambiata. Salvare
  scheda e storico nella stessa transazione. Coordinare l'autosalvataggio
  corrente per impedire che una modifica ordinaria sovrascriva il risultato
  del wizard.
- Per le schede esistenti, ricondurre talenti, privilegi, scelte e risorse
  alla concessione corretta solo quando il collegamento è certo. Se è ambiguo,
  preservare il dato e chiedere una riconciliazione nel wizard; non eliminarlo
  e non attribuirgli una fonte inventata. Le esportazioni e lo storico devono
  leggere il nuovo modello senza perdere informazioni personali.

## Stato del repository e dipendenze

- `lib/sheet.ts` contiene un solo `classe` e `livello`; `talenti` e
  `privilegi` sono coppie nome/scelte, mentre `risorse` è un elenco separato.
- `lib/characterGrants.ts` calcola alcune concessioni a partire dal livello,
  ma usa ancora cataloghi e soglie hardcoded; non collega ogni scelta alla
  singola concessione. È un punto di partenza per l'inventario, non il motore
  normativo del wizard.
- `lib/classProgression.ts` calcola già Dado Vita, incremento fisso e PF
  massimi; `lib/abilityBonus.ts` calcola il bonus di competenza e alcuni valori
  derivati. Va verificato ogni raccordo al nuovo modello e al PDF.
- `app/actions.ts` salva già scheda e storico in una transazione e `saveSheet`
  ora rifiuta il cambio diretto di livello. Il wizard richiede una nuova
  transizione con validazione specifica e salvataggio atomico.
- I nuovi domini di `PLAN_ADEGUAMENTO_2024.md` sono la futura fonte dei dati.
  I moduli delle **12 classi**, T03/T04, I00/blocchi/I10 e R01/R02 sono
  dipendenze per dichiarare completo il wizard su ogni classe. La struttura
  del wizard, i componenti UI e il motore di bozza possono essere sviluppati
  prima, senza copiare nell'interfaccia dati ancora da verificare.
- Prima di cambiare API o convenzioni Next.js consultare
  `node_modules/next/dist/docs/`. Prima di ogni modifica allo schema o
  scrittura sul database verificare la destinazione configurata.

## Fasi di realizzazione

1. **Contratto e matrice degli eventi.** Per ciascuna delle 12 classi e per
   ogni passaggio 1→2 … 19→20, registrare quali dati cambiano, quali scelte
   compaiono e le pagine PDF. Distinguere effetti automatici, configurazioni
   e risorse; segnare come aperto ciò che il PDF non chiarisce. Definire il
   formato stabile delle concessioni e delle decisioni.
2. **Motore e persistenza.** Preparazione pura della bozza, applicazione
   deterministica, validazione della transizione, gestione delle schede
   pregresse, salvataggio atomico e storico. Il motore non deve dipendere dai
   componenti React.
3. **Wizard mobile.** Freccia ↑, conferme, passaggi condizionali, testi e
   pagine del manuale, navigazione avanti/indietro, riepilogo prima/dopo,
   annullamento e recupero dagli errori. Talenti e Privilegi diventano pagine
   di consultazione con le scelte già prese.
4. **Integrazione di tutti i domini.** Collegare classe, sottoclasse,
   talenti, incantesimi e formule solo dopo la verifica dei rispettivi moduli
   2024. Togliere i percorsi che assegnano voci o testi generici senza fonte.
5. **Compatibilità e collaudo.** Migrare senza perdita le vecchie schede,
   verificare esportazioni e storico; eseguire test di regole, transazione,
   interfaccia mobile, TypeScript e build.

## Prove di accettazione

- Ogni passaggio 1→2 … 19→20 di ogni classe produce esattamente le
  concessioni e le scelte previste dalle pagine verificate del PDF. I casi
  campione includono sottoclasse, talento, cambio del bonus di competenza,
  aumento di Costituzione, progressione degli incantesimi e risorse.
- La bozza non scrive; annullare non cambia scheda né storico. Confermare due
  volte, ricaricare durante il wizard o salvare da due sessioni non duplica
  livelli, privilegi, talenti o voci di storico.
- PF, Dadi Vita, valori derivati, scelte e risorse nel riepilogo coincidono
  con la scheda salvata; i dati personali e gli utilizzi già spesi restano
  presenti. Nessun testo definisce «applicato» un effetto ancora manuale.
- L'inventario nel riepilogo mostra prima/dopo e fonte degli oggetti concessi
  da privilegi o talenti acquisiti con il livello. Il Druido del Circolo delle
  Stelle al 3° livello registra una Carta Celeste con l'aspetto scelto o tirato
  e senza duplicati; il Patto del Tomo non aggiunge un Libro delle Ombre
  permanente. Nessun talento che conferisce soltanto competenza crea oggetti.
- Il Ranger al 2° livello riceve le due lingue e la scelta di Maestria previste
  da Esploratore Esperto; il riepilogo registra entrambe le concessioni e le
  scelte. Monete e oggetti aumentano solo per concessioni esplicite verificate
  e non per il semplice cambio livello.
- Dopo un salvataggio riuscito compare «Sei passato al livello X! Ecco le
  novità:» con una lista puntata completa di aggiunte, modifiche e rimozioni
  effettive, incluse quelle derivate dai talenti e privilegi ottenuti. Ogni
  modifica numerica mostra prima e dopo; fonte e pagina sono consultabili.
  Il riepilogo si riapre dallo storico, l'indicatore resta finché non viene
  letto e tentativi ripetuti dello stesso salvataggio non creano nuove novità.
  Annullamento o errore non producono riepilogo né indicatore.
- La scheda non offre editor diretti per PF massimi, Dadi Vita totali,
  Velocità o Allineamento; `saveSheet` rifiuta tentativi di modificarli.
  Il wizard aggiorna PF massimi e Dadi Vita con fonte e formula; modifica la
  Velocità solo per un effetto permanente concesso dal livello e verificato.
  Nessun comando manuale cambia la Velocità in questa fase. La
  creazione è l'unico flusso ordinario che sceglie l'Allineamento.
- La pagina Caratteristiche non offre editor diretti dei sei punteggi o delle
  spunte dei tiri salvezza; il salvataggio ordinario rifiuta anche tentativi
  di cambiare le relative fonti. Il wizard applica solo scelte e concessioni
  documentate e aggiorna i valori derivati senza intervento manuale.
- La pagina Abilità mostra spunte e Maestria senza editor. La creazione
  raccoglie tutte le scelte iniziali; il salvataggio ordinario rifiuta ogni
  variazione di abilità o fonti, anche se inviata senza passare dall'interfaccia.
- La pagina Incantesimi mostra la lista e le caratteristiche di lancio senza
  editor; `saveSheet` rifiuta aggiunte, sostituzioni e rimozioni dirette. Gli
  slot spesi restano registrabili entro il massimo. Il wizard acquisisce o
  sostituisce solo gli incantesimi consentiti dal nuovo livello e conserva gli
  slot già spesi; incantesimi sempre preparati e libro del mago mantengono
  stati e fonti distinti.
- Le pagine Privilegi e Talenti e la lista delle competenze negli strumenti
  non offrono editor diretti, neppure per scelte o usi spesi. `saveSheet`
  rifiuta modifiche a voci, risorse, competenze e fonti inviate fuori dai
  flussi. Il wizard collega ogni nuovo privilegio, talento, risorsa e scelta
  alla concessione verificata; al livello successivo propone la sostituzione
  di un incantesimo di Iniziato alla magia solo se il talento è posseduto.
- I PE sotto soglia richiedono la conferma aggiuntiva; i PE non sono modificati.
  Il livello non può essere cambiato con l'editor ordinario né superare 20.
- Le vecchie schede mantengono talenti, privilegi, scelte e note. Le voci
  ambigue sono visibili e riconciliabili, non cancellate silenziosamente.
- Un avanzamento che concede competenza nelle armature o negli scudi aggiorna
  la competenza e la sua fonte, ma lascia invariati inventario, armatura
  indossata e scudo impugnato; il talento Corazze Leggere è un caso campione.
- I popup e i dettagli delle pagine Talenti e Privilegi riportano la voce
  specifica, la fonte e la pagina stampata; il layout è leggibile su mobile.

## Punti da chiudere prima della persistenza

- **PF attuali:** conservarli durante il semplice avanzamento. Questa è
  un'inferenza dalle pp. 27 e 42: il manuale distingue attuali e massimi e
  prescrive l'aumento dei massimi, non una guarigione al cambio livello.
  Ogni effetto specifico che aumenti anche i PF attuali va applicato secondo
  il suo testo verificato nel PDF.
- **Schede esistenti incomplete:** stabilire come presentare le decisioni
  storiche mancanti (per esempio tiri dei PF non registrati), PF massimi,
  Dadi Vita, Velocità o Allineamento assenti o incoerenti, senza fabbricare
  risultati. Gli editor diretti sono disattivati: prevedere nel wizard o in
  un flusso di riconciliazione una correzione esplicita e tracciata, senza
  sovrascrivere automaticamente i valori storici.
- **Eventi fuori avanzamento:** distinguere la velocità base dalla velocità
  corrente modificata da armatura, condizioni, incantesimi e privilegi;
  distinguere PF massimi da PF attuali e dagli effetti temporanei. Ogni
  variazione richiede una fonte verificata e una transizione dedicata.
- **Multiclasse:** fase successiva che richiede livelli per classe e le regole
  delle pp. 44–45; nessuna concessione del primo wizard deve presupporla.
