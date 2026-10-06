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
  rimuovere liberamente voci. Il wizard di creazione e quello di avanzamento
  raccolgono le scelte permanenti.
- Il cambio livello può essere avviato anche se i PE registrati sono inferiori
  alla soglia della tabella. In questo caso il wizard mostra soglia e PE attuali
  e richiede una conferma esplicita aggiuntiva. È una scelta del flusso
  dell'app; non viene presentata come regola del manuale. I PE non vengono
  aumentati automaticamente.
- Il primo rilascio copre l'avanzamento nella **classe già registrata**. La
  multiclasse è una fase distinta: oggi `Sheet` registra una sola classe e un
  solo livello. Il wizard non deve simulare la multiclasse usando il livello
  totale come livello di classe.
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
| 44–45 | Multiclasse: prerequisiti, livelli per classe, competenze, Dadi Vita, privilegi e incantesimi; base per la fase separata. |
| 51–52 | Esempio di tabella di classe, privilegio con risorsa, sottoclasse, talento concesso da un privilegio. |
| 177, 197, 199 | Talento conferito dal background; talento di Origini aggiuntivo dell'Umano; categorie, prerequisiti e ripetibilità dei talenti. |

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
   e «da gestire durante il gioco». Mostra prima/dopo per livello, PF massimi,
   Dadi Vita, bonus di competenza, caratteristiche, privilegi, talenti,
   incantesimi e valori derivati modificati. Le formule riportate sono quelle
   realmente applicate.
6. «Conferma cambio livello» è disponibile solo con tutte le scelte
   obbligatorie valide. Un solo salvataggio atomico aggiorna la scheda e lo
   storico. Un errore lascia la bozza aperta; un secondo clic non crea un
   secondo livello. Dopo il salvataggio, Talenti e Privilegi mostrano le nuove
   voci e le scelte effettuate.

## Effetti da valutare a ogni livello

La tabella è una **checklist del motore**, non un elenco di concessioni uguali
per tutte le classi. Ogni diritto e limite viene dalla tabella e dal testo
verificato della classe, sottoclasse, talento o incantesimo pertinente.

| Ambito | Automatico o richiesta al giocatore |
| --- | --- |
| Livello e PE | Aumentare di 1 il livello solo al salvataggio. Conservare i PE registrati; mostrare la soglia e l'eventuale conferma sotto soglia. |
| PF massimi e Dadi Vita | Aggiungere un Dado Vita del tipo della classe. Chiedere tiro del dado oppure valore fisso della tabella; sommare Costituzione, rispettando il minimo indicato. Conservare metodo e risultato per quel livello. Ricalcolare i PF massimi se il modificatore di Costituzione cambia, includendo l'incremento per i livelli già acquisiti. |
| Privilegi | Conferire quelli previsti al nuovo livello dalla classe e dalla sottoclasse già scelta. Mostrare le decisioni che richiedono: sottoclasse, opzioni interne, competenze, padronanze, lingue o altre scelte effettivamente presenti nel testo. Non duplicare un privilegio già conferito. |
| Talenti | Quando un privilegio concede un talento, creare una scelta vincolata alla sua fonte: categoria, prerequisiti e ripetibilità verificati. Registrare anche le scelte interne al talento e applicare i suoi effetti soltanto dove l'app li calcola davvero. |
| Caratteristiche e competenza | Applicare gli incrementi scelti tramite il talento pertinente, con limiti e requisiti verificati. Ricalcolare i modificatori e il bonus di competenza del nuovo livello; non salvare copie ridondanti dei valori derivabili. |
| Calcoli dipendenti | Aggiornare i risultati realmente calcolati: tiri salvezza, abilità e Maestria, iniziativa, percezione passiva, attacchi e danni, CA, velocità, capacità, CD e attacchi degli incantesimi. Ogni effetto non implementato va indicato come manuale, senza dichiararlo applicato. |
| Incantesimi | Usare la progressione della classe e i privilegi acquisiti per determinare trucchetti, incantesimi preparati o sostituibili, livello accessibile, slot e risorse di lancio. Chiedere le scelte previste, conservare fonte e caratteristica da incantatore di ciascun incantesimo. Non usare le attuali tabelle SRD come fonte normativa. |
| Risorse e stato di gioco | Adeguare i massimi e aggiungere le nuove risorse previste; mantenere tracciabili utilizzi già spesi, PF attuali e slot già spesi. Il cambio livello da solo non ripristina PF o risorse: le pp. 27 e 42 distinguono i PF attuali dal loro massimo e indicano l'aumento del massimo, senza prescrivere una guarigione. Applicare eventuali variazioni dei PF attuali solo quando la regola specifica lo dice. I casi non determinabili dal PDF o dalla scheda richiedono una scelta esplicita prima dell'implementazione. |
| Dati personali ed equipaggiamento | Conservare note, oggetti, quantità, monete e scelte precedenti. Non creare equipaggiamento o altri premi senza una concessione verificata della regola pertinente. |

Le opzioni che un privilegio permette di **cambiare durante il gioco** (per
esempio dopo un riposo) non diventano modifiche libere nella pagina
Privilegi: avranno un flusso guidato distinto dal cambio livello.

## Dati e motore

- Sostituire l'attuale modifica diretta di `sheet.livello` in
  `app/personaggio/[id]/CharacterClient.tsx` con l'ingresso al wizard.
- Introdurre un modello di **concessione** con ID stabile, fonte
  (`classe`, `sottoclasse`, `background`, `specie`, `talento`), livello di
  acquisizione, riferimento alla voce del manuale e scelte richieste.
  Un talento scelto deve riferirsi alla concessione che lo ha permesso.
- Conservare separatamente: dati normativi del PDF, concessioni derivate,
  risposte del giocatore, valori calcolati e stato corrente delle risorse.
  Registrare per livello il dado/valore fisso dei PF e le decisioni che non si
  possono ricostruire dalla sola scheda finale. Evitare copie dei testi del
  manuale nelle schede salvate.
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
- `app/actions.ts` salva già scheda e storico in una transazione, ma oggi
  `saveSheet` accetta anche un cambio diretto di livello. La nuova transizione
  deve avere una validazione specifica e atomica.
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
- I PE sotto soglia richiedono la conferma aggiuntiva; i PE non sono modificati.
  Il livello non può essere cambiato con l'editor ordinario né superare 20.
- Le vecchie schede mantengono talenti, privilegi, scelte e note. Le voci
  ambigue sono visibili e riconciliabili, non cancellate silenziosamente.
- I popup e i dettagli delle pagine Talenti e Privilegi riportano la voce
  specifica, la fonte e la pagina stampata; il layout è leggibile su mobile.

## Punti da chiudere prima della persistenza

- **PF attuali:** conservarli durante il semplice avanzamento. Questa è
  un'inferenza dalle pp. 27 e 42: il manuale distingue attuali e massimi e
  prescrive l'aumento dei massimi, non una guarigione al cambio livello.
  Ogni effetto specifico che aumenti anche i PF attuali va applicato secondo
  il suo testo verificato nel PDF.
- **Schede esistenti incomplete:** stabilire come presentare le decisioni
  storiche mancanti (per esempio tiri dei PF non registrati) senza fabbricare
  risultati. La soluzione deve essere verificabile prima di togliere gli
  editor manuali.
- **Multiclasse:** fase successiva che richiede livelli per classe e le regole
  delle pp. 44–45; nessuna concessione del primo wizard deve presupporla.
