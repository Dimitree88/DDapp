# Piano dei domini e degli automatismi della scheda

Stato: implementazione avanzata, non ancora completa. Sono operativi i cataloghi armi, armature, strumenti, munizioni ed equipaggiamento d'avventura; attacchi e varianti magiche dichiarate, padronanze, livelli minimi dei talenti, CA, PF massimi e velocità opzionali, slot e CD magiche, stati e risorse correnti, riposi, monete, peso e capacità di trasporto, appendice PDF. Restano progressioni complete di privilegi, origini e opzioni dei talenti, derivazione automatica delle competenze dalle loro fonti, transazioni e gestione avanzata degli oggetti magici o personalizzati. Le fonti delle competenze possono ora essere annotate sulle scelte esistenti. Le risorse per riposo hanno uno schema generico con massimo esplicito, non ancora le formule di ogni privilegio. Le schede esistenti non sono state convertite automaticamente. Audit delle voci: docs/audit-oggetti-schede.md.

## Principio di progetto

Separare sempre quattro cose:

1. **Dato di catalogo:** proprietà stabile di una voce delle regole, con fonte e versione (es. danno base del Pugnale).
2. **Scelta del personaggio:** classe, competenza, talento, arma impugnata, armatura indossata, incantesimo preparato.
3. **Stato corrente:** PF, slot spesi, munizioni, monete, quantità possedute, cariche.
4. **Valore derivato:** formula calcolata dai tre livelli precedenti, con spiegazione visibile e nessuna copia persistita quando evitabile.

L'automatismo deve scattare solo se gli input necessari sono registrati e la regola è univoca. Se servono una scelta del giocatore, una decisione del DM o un effetto temporaneo, chiedere o mostrare il valore base con un'aggiunta esplicita. Non dedurre che un oggetto sia indossato, impugnato, preparato o attivo solo perché è posseduto. Conservare un campo per oggetti e regole personalizzati, distinguendoli dai dati SRD.

## Stato iniziale verificato nel repository

| Area | Già strutturato o automatico | Lacuna principale |
| --- | --- | --- |
| Identità e origine | Classe, sottoclasse, specie, lignaggio, background, allineamento e taglia sono valori di catalogo con brevi descrizioni specifiche; le scelte iniziali già registrate sono protette. | Mancano requisiti, concessioni e progressioni strutturati. |
| Caratteristiche e abilità | Modificatori, bonus competenza, tiri salvezza, abilità, Maestria, Iniziativa con Allerta e Percezione passiva sono derivati. | Altri modificatori e cause di competenza non sono rappresentati in modo strutturato. |
| Stato | PF, PF massimi, Dadi Vita, CA, velocità, PE e Ispirazione Eroica sono campi manuali o semplici spunte. | Mancano fonti dei valori, stato dei dadi spesi, PF temporanei e condizioni. |
| Lingue | Elenco chiuso, con qualche dettaglio specifico. | La fonte delle lingue e le eventuali scelte/dialetti sono testo libero. |
| Armi | Nomi e categorie chiusi; danni, proprietà e padronanza sono consultabili nelle info; quantità e bonus manuali. | Le statistiche sono dati di consultazione, non guidano ancora modalità d'uso o formula dell'attacco. |
| Equipaggiamento | Nome e dettaglio liberi; alcune voci riconosciute hanno info specifiche; competenze armature/scudi come spunte. | Nessun catalogo completo di oggetti, quantità strutturata, armatura indossata o collegamento alla CA. |
| Privilegi e talenti | Nomi dei talenti chiusi con brevi descrizioni; Allerta modifica l'Iniziativa. | Privilegi e scelte sono testo libero; mancano prerequisiti, progressioni e risorse. |
| Incantesimi | Catalogo con livello, scuola, classi, tempo, gittata, componenti, durata, pagina e dettagli; selezione del nome. | Nessuna distinzione tra conosciuto/preparato/concesso, nessuno slot o CD/attacco derivato. |
| Monete | Cinque denominazioni e soli controlli numerici. | Nessuna conversione o registro di transazioni. |
| Esportazione | I PDF usano già alcuni valori derivati; il modello originale ha 6 righe armi e 30 incantesimi. | Le nuove proprietà richiederanno una politica esplicita per spazio, tagli e riepiloghi. |

Punti di partenza nel codice: `lib/sheet.ts`, `lib/regole-srd-2024.json`, `lib/domain.ts`, `lib/creationRules.ts`, `lib/abilityBonus.ts`, `lib/spells.ts`, `app/personaggio/[id]/CharacterClient.tsx`, `lib/exportPdf.ts`, `lib/exportTemplatePdf.ts`.

## Candidati per pagina e dominio

Legenda: **D** = dominio chiuso o catalogo; **C** = calcolo deterministico; **S** = scelta o stato da aggiungere. Le priorità sono relative al valore per questa app, non sono decisioni di realizzazione.

### 1. Stato e identità

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Livello, classe, sottoclasse | D, S | Catalogo per classe con livelli di accesso alla sottoclasse e privilegi ottenuti; mostrare solo scelte ammissibili. | Oggi c'è una sola classe e un solo livello totale: il multiclasse richiede un modello diverso. | Media |
| Specie, lignaggio, background | D, S | Cataloghi di tratti, taglie, velocità base, lingue, competenze, talenti e scelte concesse; spiegare la provenienza di ogni concessione. | Le alternative concesse non si possono scegliere automaticamente. Le integrazioni non SRD richiedono fonte distinta. | Media |
| Velocità | C, S | Calcolare la base da specie/privilegi solo dopo aver registrato fonti, modifiche permanenti e temporanee; mostrare il totale e le cause. | La velocità attuale può incorporare già modifiche non documentate. Non sovrascriverla in migrazione. | Media |
| PF massimi e Dadi Vita | D, C, S | Dado Vita per classe, avanzamenti e modificatore di Costituzione; registrare il risultato dei tiri o la scelta del valore fisso per livello. | Dai soli classe/livello/COS non si ricostruiscono i PF già scelti. Multiclasse complica la formula. | Media |
| PF correnti, PF temporanei, Dadi Vita spesi | S, C | Campi separati e azioni esplicite per danni, cure, riposi e spesa/recupero dadi; controlli sui limiti quando applicabili. | Non inferire danni o guarigioni dalle note o dagli incantesimi registrati. | Media |
| Tiri salvezza contro morte e condizioni | D, S | Registrare successi/fallimenti e condizioni come stati espliciti; mostrare promemoria delle regole e modificatori solo quando l'effetto è modellato. | Gli esiti dei dadi e la durata delle condizioni sono eventi di gioco; non dedurli dai PF o dalle note. | Bassa |
| CA e scudo | D, C, S | Catalogo armature, armatura indossata, scudo impugnato, competenza, DES e modificatori espliciti; mostrare formula e CA risultante. | Più formule alternative e privilegi di classe richiedono una scelta della formula attiva. La CA storica resta manuale finché la fonte non è nota. | Alta |
| Ispirazione Eroica | S | Mantenere la spunta; opzionale azione “usa/ottieni” nello storico. | Non è derivabile con certezza da altri campi. | Bassa |
| PE e avanzamento | D, C, S | Soglie di livello come suggerimento, confronto con PE accumulati e elenco delle scelte da compiere salendo di livello. | Non aumentare automaticamente il livello: il gruppo può usare progressione a pietre miliari. | Bassa |
| Allineamento | D | Dominio già chiuso; eventuali descrizioni specifiche solo se utili. | Nessun calcolo di regola affidabile dall'allineamento. | Già coperto |

### 2. Caratteristiche, tiri salvezza e abilità

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Punteggi e bonus esistenti | C | Conservare le formule attuali e usare un solo motore di calcolo anche nei PDF. | Non duplicare nel database modificatori, bonus o risultati. | Già coperto |
| Fonti di competenza e Maestria | D, S | Registrare quale classe, background, specie, talento o privilegio concede ogni competenza; impedire duplicati e mostrare l'origine. | Alcune concessioni permettono una scelta e vanno confermate dal giocatore. | Media |
| Bonus situazionali e sostituzione di caratteristica | S, C | Modificatori tipizzati con origine, durata e ambito (abilità, TS, iniziativa, attacco); somma solo se applicabile. | Prima definire una regola chiara per cumulo, scadenza e precedenza. | Bassa |
| Valori passivi aggiuntivi | C | Eventuali altri valori passivi ottenuti da 10 + bonus dell'abilità pertinente, solo se utili al gruppo. | I modificatori di contesto non sono deducibili. | Bassa |

### 3. Lingue

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Fonti e scelte di lingua | D, S | Legare ogni lingua alla concessione di specie, background, classe o privilegio; registrare la scelta dove la regola concede alternative. | Lingue apprese durante la campagna richiedono una fonte manuale. | Bassa |
| Dialetti e comunicazione | D | Conservare soltanto informazioni specifiche utili, come i dialetti del Primordiale; esporle sulla singola lingua. | Non generare spiegazioni generiche per tutte le voci. | In parte coperto |

### 4. Armi e attacchi

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Catalogo completo delle armi | D | Per ogni arma: categoria, mischia/distanza, dado e tipo di danno, proprietà, gittata quando presente, padronanza, costo e peso se servono all'inventario. | Popolare e verificare **ogni** voce dell'attuale catalogo SRD italiano; non derivare la categoria dall'ordine della lista. | Alta |
| Competenza nell'arma | C | Risolvere la competenza da categoria o singola arma, senza obbligare a duplicare tutte le armi concesse. | Le competenze speciali vanno registrate come fonti esplicite. | Alta |
| Bonus d'attacco | C, S | Sommare caratteristica pertinente, competenza se posseduta e modificatori espliciti; mostrare la formula. | Finesse, lancio e altri modi d'uso richiedono una modalità scelta. Il campo attuale `bonus` può contenere eccezioni personali. | Alta |
| Danno mostrato | C, S | Dado/tipo dal catalogo + caratteristica applicabile + bonus permanenti strutturati; distinguere le alternative (es. uso versatile). | Non calcolare automaticamente danni condizionali, critici o effetti del bersaglio. | Alta |
| Padronanza d'armi | D, S | Proprietà di padronanza per arma; registrare quali armi il personaggio ha scelto di padroneggiare e mostrare l'effetto. | Possedere o saper usare un'arma non implica averne la padronanza. | Media |
| Arma magica/personalizzata e munizioni | S, C | Istanza con variante, bonus magico, quantità, stato impugnato; munizioni come risorsa collegabile agli attacchi a distanza. | Il catalogo base non descrive ogni oggetto unico; serve voce personalizzata e override con provenienza. | Media |

### 5. Equipaggiamento, armature e oggetti

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Catalogo equipaggiamento | D | Cataloghi separati per armature, scudi, equipaggiamento d'avventura, strumenti, munizioni e consumabili; proprietà, prezzo, peso e unità solo dove la fonte li fornisce. | Lasciare oggetti personalizzati e descrizioni personali. Non fingere precisione per oggetti senza dati. | Alta |
| Inventario strutturato | S, C | ID di catalogo opzionale, nome personalizzato, quantità, unità, contenitore e note; raggruppamento delle voci identiche e totale quantità. | Migrare con prudenza voci come `Frecce x16` o `Torce` con `x10` nelle note: l'interpretazione non è sempre certa. | Alta |
| Armatura indossata e scudo impugnato | S, C | Stato distinto da “posseduto”; collegamento alla CA e indicazione di eventuali requisiti/penalità dell'armatura. | L'attuale `scudo` è una spunta: chiarire se significa possesso o uso prima di convertirla. | Alta |
| Peso e capacità di trasporto | D, C | Sommare quantità × peso, includendo eventualmente monete/contenitori; confrontare con la capacità determinata dalle regole adottate. | Scegliere unità e trattamento di oggetti indossati, contenitori e varianti prima di esporre un totale. | Bassa |
| Kit, strumenti e consumabili | D, S | Usare domini per tipo di strumento e competenza; registrare cariche/usi restanti dei consumabili. | Una descrizione del kit non equivale alla competenza nell'usarlo. | Media |
| Oggetti magici | D, S | Eventuale catalogo limitato alle voci coperte dalla fonte, con attunement/sintonizzazione, cariche e bonus tipizzati. | Rimandare finché inventario, stati equipaggiati e gestione delle fonti sono solidi. | Bassa |

### 6. Privilegi di classe, specie, background e talenti

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Catalogo privilegi e progressioni | D | ID, fonte, classe/specie/background/sottoclasse, livello di acquisizione, testo breve e scelte richieste. Mostrare privilegi posseduti per livello. | L'attuale lista `titolo/scelte` è libera; importare solo corrispondenze certe. | Media |
| Talenti strutturati | D, S | Prerequisiti, livello, opzioni e modificatori che applicano; validare acquisizione e scelte. | Non aggiungere in automatico un talento solo perché compare in un background non ancora strutturato. | Media |
| Effetti tipizzati | C, S | Associare effetti supportati (es. Allerta, bonus a una categoria di attacchi, Maestria, incremento caratteristica) a sorgenti dichiarate. | Ogni effetto richiede prova puntuale; non interpretare automaticamente testo libero. | Media |
| Risorse per riposo | D, S, C | Massimi da classe/livello/caratteristica quando univoci; usi correnti e ripristino esplicito dopo riposo breve/lungo. | Riposi e spese sono eventi di gioco, non deducibili dalla scheda. | Media |
| Scelte già acquisite | S | Mantenere la protezione esistente e tracciare separatamente acquisizione e correzione amministrativa. | Non bloccare quantità consumabili o stati temporanei con le regole delle scelte permanenti. | Media |

### 7. Incantesimi

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Filtro per classe, livello e fonte | D, S | Usare i dettagli SRD già presenti per mostrare le opzioni ammissibili; includere eccezioni concesse da talenti o privilegi. | “Nella lista della classe” non significa automaticamente conosciuto o preparato. | Alta |
| Stato dell'incantesimo | S | Distinguere conosciuto, nel libro, preparato, sempre preparato e concesso da una fonte; registrare separatamente le scelte. | Dipende dalla classe; evitare un unico booleano valido per tutti. | Alta |
| CD e bonus di attacco magico | D, C, S | Caratteristica da classe/fonte + bonus competenza, con eventuali modificatori espliciti; formula visibile. | Se esistono più fonti di lancio, ogni incantesimo deve sapere quale usa. | Alta |
| Slot e progressione | D, C, S | Tabelle per classe/livello, slot massimi derivati e spesi come stato; gestire separatamente la magia del Warlock e gli eventuali lanci gratuiti. | Multiclasse, recuperi e privilegi speciali richiedono modello dedicato. | Media |
| Componenti, concentrazione, rituali e materiali | D | Mostrare dati già catalogati e, se utile, filtri o promemoria specifici. | Non dedurre automaticamente se il personaggio ha il materiale o mantiene la concentrazione. | Media |
| Danno/cura variabile e scaling | D, C, S | Solo per incantesimi con struttura verificata: mostrare dado e modifiche per livello di slot/personaggio quando deterministiche. | Molti effetti dipendono da bersagli, tiri e scelte; evitare parsing del testo descrittivo. | Bassa |

### 8. Monete e note

| Candidato | Tipo | Dati necessari e comportamento proposto | Limite / decisione | Priorità |
| --- | --- | --- | --- | --- |
| Valore equivalente delle monete | D, C | Tabella dei tassi della fonte e totale in una denominazione scelta; conversione esplicita senza alterare le quantità possedute. | La conversione aritmetica non rappresenta uno scambio realmente effettuato. | Bassa |
| Transazioni e acquisti | S, C | Registrare entrata/uscita con oggetto, quantità e prezzo; aggiornare inventario e monete solo dopo conferma. | Prezzi negoziati, sconti e bottino non derivano dal listino. | Bassa |
| Note libere | — | Restano testo libero; si possono proporre collegamenti facoltativi a condizioni, oggetti o fonti. | Non usare le note come input di calcoli. | Nessuna |

## Funzioni trasversali

| Candidato | Comportamento proposto | Vincolo |
| --- | --- | --- |
| Fonte unica dei dati | Cataloghi tipizzati con ID stabile, nome italiano, edizione/versione, fonte, pagina e provenienza SRD/integrazione/homebrew. UI, validazione e PDF leggono gli stessi dati. | Non usare il nome visualizzato come chiave persistente se può cambiare. |
| Scelte guidate e validazione | Il selettore mostra solo scelte applicabili; il server convalida le stesse regole e spiega un valore fuori dominio. | Mantenere una via esplicita per eccezioni del DM e contenuti personalizzati. |
| Spiegazione dei calcoli | Per ogni valore derivato: risultato, input, fonti e formula, come già accade per abilità e Iniziativa. | Niente popup generici sulle etichette senza regola concreta. |
| Eventi di stato e storico | Distinguere modifiche permanenti, spese di risorse, riposi, acquisti e correzioni; registrare prima/dopo e causa quando utile. | Lo storico attuale registra snapshot/differenze, non ricostruisce eventi precedenti. |
| Compatibilità delle schede | `normalizeSheet()` conserva i campi esistenti; cataloghi nuovi aggiungono dati opzionali. Audit prima della migrazione, report delle ambiguità, backup e rollback. | Il database locale può puntare ai dati reali: nessuna conversione distruttiva automatica. |
| PDF dell'app e modello originale | Riutilizzare i calcoli e definire cosa esportare per proprietà, quantità, stati e risorse; segnalare i dati che non entrano nel modello. | Modello originale limitato a 6 armi e 30 incantesimi; non perdere dati senza avviso. |
| Controlli automatici | Test di copertura catalogo↔selettori, formule, eccezioni, migrazione e parità UI/PDF. | Verificare regole contro la fonte prima di aggiungere un effetto. |

Nome del personaggio, PIN, permessi di modifica, navigazione e note narrative non hanno un dominio di regole D&D utile da automatizzare. Restano comunque soggetti alle normali validazioni applicative (formato, lunghezza, autorizzazione).

## Dipendenze e ordine suggerito

1. **Base condivisa:** ID stabili, fonte/versione, tipi di dato, dati personalizzati, controlli di copertura. Nessuna modifica visibile richiesta.
2. **Armi:** catalogo completo → competenza → modalità d'uso → bonus/danno derivati → padronanza e varianti. Il catalogo da solo ha già valore senza cambiare i campi manuali.
3. **Equipaggiamento e CA:** catalogo → inventario con quantità → stati indossato/impugnato → formule di CA. Non calcolare la CA prima dello stato equipaggiato.
4. **Incantesimi:** fonte e stato di ciascun incantesimo → filtri → CD/attacco → slot e risorse. Procedere per una classe alla volta, con eccezioni dichiarate.
5. **Origini, classi, privilegi e talenti:** cataloghi di concessioni e progressioni → scelte guidate → effetti tipizzati. Questa parte abilita PF, velocità e altre risorse derivate.
6. **Economia e gestione avanzata:** monete, transazioni, peso, consumabili e riposi, se il gruppo li userà davvero.

Ogni blocco è selezionabile separatamente. Prima di realizzarlo va deciso: quali personaggi/classi coprire, quanto spazio dare alle eccezioni del DM, se i valori manuali esistenti diventano override o restano il dato principale e quali informazioni devono apparire in ciascun PDF.

## Fonti per la verifica delle regole

- [SRD 5.2.1 italiano](https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf), già indicato in `lib/regole-srd-2024.json`.
- [Pagina ufficiale SRD 5.2.1](https://www.dndbeyond.com/srd), per versione e licenza.
- [Regole base 2024: equipaggiamento](https://www.dndbeyond.com/sources/dnd/br-2024/equipment), per tabelle di armi, armature e oggetti.
- [Regole base 2024: classi](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes) e [incantesimi](https://www.dndbeyond.com/sources/dnd/br-2024/spells), per progressioni e lancio.

Prima di trascrivere formule o tabelle nel codice, verificare che la voce sia presente nella fonte che il progetto può usare e che la traduzione italiana corrisponda all'edizione adottata. Le voci extra già presenti nel catalogo vanno etichettate con la loro fonte separata.
