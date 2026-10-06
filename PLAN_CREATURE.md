# Piano per le creature condivise e quelle delle Sessioni

## Obiettivo e decisioni già prese

Gestire creature e personaggi non giocanti con una scheda consultabile da
Master e giocatori. Una creatura può partecipare a una Sessione come alleata,
avversaria o figura neutrale, senza essere assegnata a un giocatore. La vista
Master mostra le creature coinvolte accanto ai personaggi del gruppo e ne
registra gli eventi nella Sessione aperta.

Il gruppo può creare **un numero qualsiasi di creature condivise**. Ciascuna
ha un'identità e uno stato indipendenti che persistono tra Sessioni: PF, note
e storico non ripartono dai valori iniziali quando inizia una nuova Sessione.
CA, PF, velocità, GS e azioni sono dati della singola scheda; i valori reali
sono inseriti dal gruppo. Nessuna creatura predefinita o nome speciale è
richiesto dal modello.

Restano valide le decisioni di `PLAN_MASTER_TOOLS.md`: ogni pagina è visibile
a tutti, non si introducono ruoli o permessi; le azioni di una Sessione
modificano subito le schede e la chiusura archivia gli eventi. La scheda
di ogni creatura condivisa è quindi pubblica nell'app anche fuori da una
Sessione.

## Fonte delle regole e confine dei dati personalizzati

L'unica fonte normativa è
`docs/regole/Manuale Del Giocatore - 2024.pdf`. Pagine **stampate** verificate
direttamente:

| Pagina | Contenuto pertinente |
| --- | --- |
| 28 | Un mostro normalmente muore quando scende a 0 PF; il DM può scegliere di trattare un singolo mostro come un personaggio. |
| 346–348 e seguenti, Appendice B | Schede delle statistiche delle creature presenti nel libro. L'introduzione prevede che il DM possa modificarne i dettagli. Le schede mostrano, secondo la creatura, identità/tipo/taglia/allineamento, CA, iniziativa, PF, velocità, caratteristiche e tiri salvezza, abilità, sensi, lingue, GS con PE e bonus di competenza, tratti, azioni e azioni bonus. |

Prima di importare una creatura specifica dell'Appendice B o automatizzare
una sua capacità, verificare **la sua voce** nel PDF e annotare la pagina.
Una creatura personalizzata può contenere dati e testo immessi dal
gruppo: l'app li presenta esplicitamente come contenuti del tavolo, senza
attribuirli al manuale. Se un dato necessario a un automatismo non è definito
o non è chiarito dal PDF, chiedere una decisione al tavolo e registrarla come
tale; non usare altri manuali, SRD o conoscenze ricordate.

## Modello di dominio

1. **Scheda della creatura.** Identità stabile, nome, eventuale descrizione,
   origine (`Appendice B` con pagina verificata oppure `personalizzata`),
   dati delle statistiche e note. La scheda di una creatura condivisa contiene
   anche lo stato corrente canonico: PF, eventuali stati e risorse applicabili.
   Non è una `Sheet` del personaggio giocante: non le si attribuiscono classe,
   livello, background, talenti o wizard di avanzamento senza una decisione e
   una base di regole specifiche.
2. **Presenza in Sessione.** Una relazione collega una creatura esistente
   alla Sessione, con ruolo narrativo (alleata, avversaria, neutrale), stato di
   presenza e note locali. Ogni creatura condivisa conserva lo
   stesso ID e stato canonico tra Sessioni. Una presenza può essere aggiunta
   o rimossa mentre la Sessione è aperta; gli eventi già registrati restano
   nello storico.
3. **Esemplare della sola Sessione.** Per più creature dello stesso tipo
   nell'incontro, ogni esemplare ha ID, etichetta e PF/stati indipendenti
   (es. «Creatura 1», «Creatura 2»). Può partire da una copia dei valori base
   verificati o inseriti dal gruppo. La sua storia resta nell'archivio della
   Sessione. Un comando esplicito «Conserva come creatura condivisa» crea una
   scheda persistente; la chiusura non promuove automaticamente gli esemplari.
4. **Evento.** Ogni variazione di stato registra Sessione, creatura/esemplare,
   tipo di azione, ora, valore prima/dopo, nota/fonte e provenienza (scheda
   oppure vista Master). Le modifiche fuori Sessione restano nello storico
   della creatura condivisa senza una Sessione fittizia.

Una creatura può essere coinvolta in più Sessioni successive. La prima
versione segue la scelta di `PLAN_MASTER_TOOLS.md` di avere una sola Sessione
aperta alla volta; evita così due Sessioni contemporanee che scrivono sullo
stesso stato vivo.

## Dati della scheda

La prima schermata privilegia **nome, ruolo nella Sessione, CA, PF attuali /
massimi, velocità, GS e azioni**. Il GS è un valore annotato nella
scheda, non un livello del personaggio e non una ricompensa PE assegnata in
automatico.

Il dettaglio espandibile contiene, se disponibili: tipo, taglia,
allineamento, iniziativa, caratteristiche e tiri salvezza, abilità, sensi,
lingue, PE e bonus di competenza associati al GS, tratti, azioni, azioni
bonus, reazioni o altre sezioni presenti nella specifica voce verificata,
risorse, condizioni, note e riferimento alla pagina PDF. Per una creatura
personalizzata questi campi sono compilabili senza obbligare a inventare
valori mancanti. Un dato assente appare come «da definire», mai come zero.

Distinguere chiaramente:

- **Valori base** della scheda, modificabili con un'azione «Modifica scheda»
  che mostra la differenza e registra la revisione.
- **Stato corrente** (PF, PF temporanei se applicabili, condizioni, risorse),
  aggiornato da comandi rapidi con storico e anteprima.
- **Dati dell'incontro** (iniziativa tirata, posizione nell'ordine, round,
  note tattiche), conservati nella Sessione senza alterare la scheda base.

Per una voce dell'Appendice B, conservare una copia immutabile dei dati
verificati e rappresentare eventuali varianti del tavolo come modifiche
esplicite. Non sovrascrivere il riferimento normativo con il valore adattato.

## Interfaccia mobile

- **Elenco Creature** accessibile a tutti: ricerca, schede condivise,
  indicatore «nella Sessione aperta» e scheda di dettaglio. Creazione di
  «Creatura personalizzata» con il minimo necessario (nome); altri dati
  aggiungibili progressivamente. La creazione da Appendice B sarà disponibile
  solo per voci già trascritte e verificate nel progetto.
- **Scheda di ogni creatura** con testata compatta, statistiche principali, azioni
  leggibili senza modifica accidentale, stati correnti, note e cronologia per
  Sessione. Pulsanti di modifica separati dalla consultazione. Un collegamento
  porta alla Sessione aperta se la creatura vi partecipa.
- **Vista Master** con sezione creature della Sessione, card compatte e
  comandi rapidi per danno, guarigione, condizioni, iniziativa e note.
  Aggiungere una creatura esistente non duplica i suoi PF; aggiungere più
  esemplari crea stati separati. Il Master sceglie i destinatari dei comandi
  di gruppo, compreso il riposo, invece di includere ogni creatura presente.
- **Archivio Sessione** con elenco delle creature coinvolte, eventi e link
  alla scheda condivisa o allo snapshot dell'esemplare della sola Sessione.
  Chiudere la Sessione non cancella le creature condivise né ne azzera i PF.

Senza account, chiunque acceda all'app può vedere e usare i controlli. Lo
storico indica la superficie da cui è partita l'azione, non attribuisce
un'identità personale non verificata.

## Regole operative da distinguere dai personaggi giocanti

- **Danno e guarigione:** condividere con `PLAN_MASTER_TOOLS.md` le regole
  generali sui PF solo dove applicabili e verificate. La prima modalità
  registra danno già determinato al tavolo; non calcola automaticamente
  resistenze, immunità o effetti dal testo libero della creatura.
- **0 PF:** la scheda propone per ogni creatura condivisa o esemplare la
  gestione ordinaria del mostro e la scelta del DM di trattarlo come un
  personaggio, come consentito a p. 28. La scelta è visibile e registrata;
  non applicare automaticamente tiri salvezza contro morte dei personaggi a
  tutte le creature. La modalità va scelta per ciascuna creatura dal gruppo
  quando si compilano i suoi dati, senza presumerla dal nome o dall'uso narrativo.
- **Riposo:** una creatura può essere selezionata per un riposo solo dopo la
  verifica delle regole applicabili al suo caso. Le ricariche e le capacità
  della sua scheda non sono dedotte dal solo nome del riposo. La chiusura di
  Sessione non esegue alcun riposo.
- **GS e PE:** mostrare i valori della scheda se presenti; la sconfitta di
  una creatura non accredita PE ai personaggi senza una decisione esplicita
  del Master e il relativo evento di Sessione.
- **Azioni e capacità:** testo consultabile; i pulsanti che ne applicano
  effetti nasceranno solo quando il testo specifico nel PDF e i dati
  necessari saranno verificati. Per le capacità personalizzate registrare
  l'esito dichiarato dal tavolo senza fingere una regola del manuale.

## Persistenza e integrazione

Oggi `lib/db/schema.ts` contiene `characters` e `character_history`, ma non
creature o Sessioni. Il modello proposto introduce `creatures`, revisioni e
storico delle creature, relazioni `session_creatures` e, per gli esemplari
temporanei, stato e snapshot della Sessione. L'ID di una creatura condivisa
non cambia quando entra o esce da una Sessione. La cancellazione o
l'archiviazione di una scheda non deve cancellare eventi di Sessioni chiuse;
lo storico conserva almeno nome e snapshot necessari per leggerle.

Comandi di stato relativi e idempotenti, controllo della versione e
transazione unica aggiornano scheda/esemplare e storico. Per una Sessione
aperta, aggiornano anche l'evento di Sessione nella stessa transazione. Una
modifica concorrente richiede di ricaricare e mostrare di nuovo l'anteprima.
Una correzione registra un nuovo evento, senza riscrivere una Sessione chiusa.

Prima di modificare lo schema o scrivere nel database, verificare la
destinazione configurata. Prima di cambiare API o convenzioni Next.js 16,
consultare `node_modules/next/dist/docs/`.

## Sequenza di lavoro

1. Definire il contratto comune con `PLAN_MASTER_TOOLS.md` per Sessioni,
   partecipanti, eventi e chiusura. Mappare quali comandi PF/stati/riposo
   valgono per creature e quali richiedono un flusso distinto.
2. Introdurre scheda, origine dei dati, stato canonico e storico delle
   creature condivise. Costruire creazione personalizzata e vista pubblica;
   verificare più schede indipendenti con valori inseriti dal gruppo.
3. Collegare creature persistenti e più esemplari indipendenti alle Sessioni.
   Esporli nella vista Master e nell'archivio. Integrare iniziativa e comandi
   rapidi, con regola esplicita per 0 PF.
4. Aggiungere solo le voci dell'Appendice B effettivamente verificate nel
   PDF, con pagina e prove. Aggiungere eventuali automatismi specifici per
   piccoli incrementi, dopo verifica della voce pertinente.
5. Provare la continuità di più creature condivise su più Sessioni e la separazione tra
   scheda base, stato vivo, esemplari temporanei e snapshot storici.

## Prove di accettazione

- Creo più creature senza proprietario, inserisco CA, PF, velocità, GS e azioni
  forniti dal gruppo e apro ciascuna scheda da Master e da una normale pagina
  giocatore. I campi mancanti non ricevono valori inventati.
- Aggiungo una creatura condivisa a una Sessione, le modifico i PF e li vedo
  subito nella scheda pubblica. Dopo la chiusura, in una nuova Sessione
  conserva PF, note e storico; non si crea una seconda copia della sua
  identità. Le altre creature condivise mantengono il proprio stato distinto.
- Due esemplari della stessa creatura nella Sessione hanno PF, iniziativa e
  condizioni indipendenti. La chiusura archivia i loro snapshot senza
  trasformarli automaticamente in creature persistenti.
- A 0 PF si usa la modalità scelta per quella creatura; i tiri salvezza
  contro morte non compaiono indiscriminatamente. La scelta e il suo esito
  restano leggibili nello storico.
- Un evento di Sessione e lo stato della creatura si salvano insieme una
  sola volta. Doppio clic e aggiornamenti concorrenti non duplicano danni.
  La chiusura non ripete eventi, non riposa le creature e non cancella stati
  che devono persistere.
- Una scheda presa dall'Appendice B riporta la pagina verificata; una scheda
  personalizzata o modificata indica chiaramente l'origine dei suoi valori.
