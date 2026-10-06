# Piano — Lancio incantesimi

## Obiettivo

Permettere dalla scheda di **lanciare un incantesimo con un flusso guidato** che registri il consumo corretto: nessuno slot per un trucchetto o rituale, uno slot scelto per un lancio ordinario, oppure l'uso gratuito concesso da un privilegio. La pagina continua a mostrare totale, spesi e rimanenti degli slot in sola lettura. Il nome dell'incantesimo continua ad aprire il popup con la scheda completa.

Il primo caso da rendere completo è **Iniziato alla magia** di Erin: un incantesimo di 1° livello sempre preparato, lanciabile una volta senza slot per riposo lungo e anche mediante uno slot disponibile; due trucchetti; caratteristica da incantatore scelta quando si ottiene il talento. Il modello deve funzionare anche se un personaggio ottiene il talento più volte da liste diverse.

## Regole verificate nel PDF locale

Fonte unica: `docs/regole/Manuale Del Giocatore - 2024.pdf` (numeri di pagina stampati).

| Pagina | Regola rilevante |
| --- | --- |
| 201 | Iniziato alla magia: due trucchetti e un incantesimo di 1° livello dalla stessa lista (Chierico, Druido o Mago); scelta di Intelligenza, Saggezza o Carisma; incantesimo sempre preparato; un lancio senza slot recuperato dopo riposo lungo; possibile uso degli slot disponibili; al nuovo livello sostituzione di uno degli incantesimi del talento con uno dello stesso livello e della lista scelta; talento ripetibile scegliendo ogni volta una lista diversa. |
| 235–236 | Trucchetti senza slot; incantesimi di livello 1+ con slot di livello almeno pari; riposo lungo ripristina gli slot spesi; rituale preparato senza slot e con 10 minuti aggiuntivi; un solo slot speso per lanciare un incantesimo in un turno; uno slot superiore aumenta il livello del lancio. |
| 79–80 | Il Druido usa Saggezza per i propri incantesimi; la tabella determina slot e incantesimi preparati; Druidico rende *Parlare con gli animali* sempre preparato; l'Ordine Primordiale Mago aggiunge un trucchetto da Druido. |
| 165 | Gli slot di Magia del Patto del Warlock si recuperano con riposo breve o lungo: la ricarica degli slot va quindi associata alla loro fonte. |
| 371 | Il completamento del riposo ricarica le capacità speciali secondo la loro descrizione. |

Prima di aggiungere regole di altri privilegi, classi o incantesimi al flusso, verificare la loro voce direttamente nel PDF. I cataloghi del repository descrivono i dati attuali dell'app e vanno confrontati con il PDF prima di alimentare una scelta o un automatismo.

## Modello dei dati

1. **Origine del lancio.** Ogni incantesimo posseduto deve mantenere un riferimento stabile alla fonte concreta (`classe`, singola istanza di `talento`, `privilegio` o altra fonte verificata), allo stato (per esempio preparato o sempre preparato), alla lista applicabile e alla caratteristica da incantatore. Due fonti possono concedere lo stesso nome: restano due possibilità di lancio distinte, senza deduplicare i diritti del personaggio.
2. **Scelte di Iniziato alla magia.** Per ogni istanza conservare lista scelta, caratteristica scelta, due trucchetti, incantesimo di 1° livello e identità dell'istanza. La lista e la caratteristica restano associate al talento quando si sostituisce un incantesimo. Non ricavare la caratteristica dalla classe del personaggio.
3. **Uso gratuito.** Tenere una risorsa separata con massimo `1`, spesi `0/1`, ricarica `riposoLungo`, collegata all'istanza del talento. La risorsa rappresenta il lancio gratuito dell'incantesimo di 1° livello e continua a esistere se quell'incantesimo viene sostituito al cambio livello. La sostituzione non ripristina l'uso speso.
4. **Slot.** Conservare per livello e fonte il massimo e gli slot spesi. Le quantità disponibili derivano dalle tabelle e dalle altre regole pertinenti verificate nel PDF; il numero speso cambia tramite il comando di lancio, riposo o una correzione tracciata. Prevedere insiemi di slot con ricariche diverse, incluso Magia del Patto. Non rendere editabile `slotSpesi` nella scheda.
5. **Registro.** Ogni lancio registra personaggio, incantesimo, fonte, modalità (`trucchetto`, `slot`, `gratuitoDaTalento`, `rituale`), eventuale livello dello slot, ora, autore e valori prima/dopo. Usare un identificatore del comando per evitare doppi consumi da ritenti o doppi tocchi.

Non assumere che l'attuale `fonte: "talento"` basti a distinguere due istanze dello stesso talento. La migrazione deve introdurre identità e collegamenti prima di attivare il consumo automatico.

## Flusso nella scheda

1. La lista mostra nome, livello e informazioni rapide già disponibili. Il nome apre sempre il popup completo. Un'azione separata **Lancia** apre il flusso guidato.
2. Il flusso mostra l'origine dell'incantesimo e le modalità consentite. Per l'incantesimo di Iniziato alla magia: **Lancio gratuito: disponibile/usato** e **Usa slot** con soli livelli disponibili e validi. Se è presente anche da un'altra fonte, chiedere quale origine si sta usando.
3. Prima della conferma mostrare cosa sarà consumato e quale caratteristica da incantatore si applica. Per l'origine Druido di Erin è Saggezza; per il suo Iniziato alla magia, la scelta registrata è Carisma. Il lancio gratuito scala solo la risorsa del talento; il lancio con slot scala solo lo slot scelto. Un trucchetto non scala nessuno dei due.
4. Dopo la conferma aggiornare riepilogo slot, disponibilità del lancio gratuito e registro. Un errore non deve lasciare consumi parziali. La conferma non applica automaticamente danni, cure, bersagli o concentrazione: tali effetti richiedono un flusso distinto basato sulle singole voci del PDF.
5. Per un incantesimo con descrittore rituale, proporre la modalità rituale soltanto se preparato e se la fonte consente quel lancio; indicare i 10 minuti aggiuntivi. Finché non esiste un contesto di turni affidabile, mostrare la regola di un solo slot per turno senza simulare un blocco fondato su dati mancanti.

## Operazioni sul server

- Un comando unico `lanciaIncantesimo` verifica, sui dati correnti del personaggio, possesso e stato dell'incantesimo, origine, modalità, livello e disponibilità dello slot o dell'uso gratuito. Aggiorna consumo e registro in una transazione atomica; due conferme simultanee non possono spendere la stessa ultima risorsa.
- Il cliente non invia un nuovo totale di slot o risorse: invia la scelta di lancio. La validazione non si basa sui valori mostrati in pagina, che potrebbero essere superati.
- Il comando di riposo lungo, coordinato con `PLAN_MASTER_TOOLS.md`, ripristina gli slot previsti e l'uso gratuito di Iniziato alla magia. Il riposo breve ripristina solo le risorse la cui fonte lo prevede. Il cambio livello non equivale a un riposo.
- Le eventuali correzioni manuali del Master sono un comando distinto, motivato e registrato, come previsto dal piano Master.
- Prima di qualsiasi scrittura al database, controllare la destinazione configurata e la migrazione applicata.

## Cambio livello

Integrare in `PLAN_CAMBIO_LIVELLO.md` una scelta facoltativa per ciascuna istanza di Iniziato alla magia: sostituire **uno** dei due trucchetti oppure l'incantesimo di 1° livello con un altro dello stesso livello appartenente alla lista scelta per quell'istanza. Mostrare la scelta precedente e la nuova, senza cambiare lista, caratteristica o stato dell'uso gratuito. La preparazione degli incantesimi di classe resta un passaggio separato con le regole della classe. Salvare tutte le scelte del livello in modo atomico.

## Dati esistenti di Erin

Le scelte ricostruite in questa conversazione vanno trattate come dati da riconciliare, senza scrittura automatica ora:

- Druido: trucchetti **Guida**, **Spruzzo velenoso**; Ordine Primordiale **Mago**: **Produrre fiamma**; *Parlare con gli animali* sempre preparato da Druidico.
- Druido, incantesimi preparati di 1° livello: **Cura ferite**, **Individuazione delle malattie e dei veleni**, **Onda tonante**, **Protezione dal bene e dal male**, **Coltello di ghiaccio**.
- Iniziato alla magia concesso da **Guida**: lista **Druido**, caratteristica **Carisma**; trucchetti **Salvare i morenti** e **Luce splendente**, incantesimo di 1° livello sempre preparato **Nube di nebbia**. **Prestidigitazione** proviene dall'Elfo alto.
- Il giocatore ha confermato che il lancio gratuito di **Nube di nebbia** non è mai stato usato: l'uso è disponibile (`massimo: 1`, `spesi: 0`, ricarica dopo riposo lungo). Il flusso di lancio guidato dovrà consumarlo quando sarà implementato.
- Per il lignaggio **Elfo alto** il giocatore ha scelto **Intelligenza** come caratteristica da incantatore; si applica a **Prestidigitazione** e agli altri incantesimi ottenuti dal lignaggio ai livelli previsti (Manuale, p. 189).

La precedente attribuzione al talento della lista Mago (**Dardo di fuoco**, **Stretta folgorante**, **Comprensione dei linguaggi**) è stata ritirata: non deriva dal background Guida del PDF, p. 181. L'Ordine Primordiale **Mago** del Druido è una scelta distinta e concede un trucchetto dalla lista **Druido**.

## Sequenza di realizzazione

1. **Inventario e riconciliazione.** Mappare schema, dati persistiti, catalogo e schermata attuale; verificare nel PDF ogni voce di gioco usata dalle prime schermate e dai test. Usare le scelte registrate di Erin per Iniziato alla magia (Druido).
2. **Dati e migrazione.** Introdurre origini identificabili, istanze del talento, risorse collegate, insiemi di slot e registro, conservando i dati esistenti. Eseguire anteprima della migrazione e controllare la destinazione del database prima di applicarla.
3. **Lancio guidato.** Implementare il comando atomico e la UI mobile; mantenere il popup completo e i conteggi in sola lettura.
4. **Riposo e cambio livello.** Collegare la ricarica a `PLAN_MASTER_TOOLS.md` e la sostituzione a `PLAN_CAMBIO_LIVELLO.md`, senza duplicare i rispettivi flussi.
5. **Verifica e rilascio.** Provare i casi sotto, controllare i dati migrati e pubblicare solo dopo le verifiche previste dal progetto.

## Criteri di accettazione

- Un trucchetto e un rituale valido non consumano slot; un lancio con slot consuma esattamente uno slot disponibile di livello valido.
- L'incantesimo di Iniziato alla magia può essere lanciato gratuitamente una volta; dopo resta l'opzione con slot. Un riposo lungo riabilita l'uso gratuito; il cambio livello no.
- Sostituire uno degli incantesimi del talento al nuovo livello conserva lista, caratteristica e uso gratuito già speso. Una sostituzione fuori lista o di livello diverso è respinta.
- Uno stesso incantesimo con più origini mostra le scelte distinte; la caratteristica usata e il consumo registrato corrispondono all'origine selezionata.
- Totale/spesi/rimanenti restano coerenti dopo lancio, riposo e ricarica della pagina; doppi tocchi e richieste concorrenti non consumano due volte l'ultima risorsa.
- Il popup dell'incantesimo resta apribile dalla lista e mostra le informazioni complete; nessun campo di modifica diretta degli slot spesi compare nella scheda.
