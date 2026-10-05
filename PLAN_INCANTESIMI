# Piano di migrazione degli incantesimi al Manuale del Giocatore 2024

## Obiettivo

Portare **tutti** gli incantesimi selezionabili e le relative regole dell'app a
coincidere con `docs/regole/Manuale Del Giocatore - 2024.pdf`, unica fonte
normativa. Il lavoro comprende nomi, elenco completo, livello, scuola, classi,
tempo di lancio, gittata, componenti, durata, descrizione degli effetti,
potenziamento con slot superiori, requisiti e interazioni con la scheda.

## Stato iniziale

Il catalogo selezionabile contiene 391 nomi. I dettagli completi per 321 nomi
provengono ancora da `lib/incantesimi-dettagli-srd-2024.json`; 70 voci del file
`lib/manuale-2024-spells.json` hanno solo dati parziali. Anche
`lib/spellEffects.ts` contiene sintesi provenienti dall'SRD. Questi dati non
sono ancora certificati rispetto al Manuale 2024.

## Lavoro da completare

1. Ricostruire dal PDF l'indice completo degli incantesimi, con pagina e classe,
   e confrontarlo in entrambe le direzioni con il catalogo dell'app. Risolvere
   nomi cambiati, voci mancanti e voci estranee, mantenendo alias solo per la
   lettura delle schede già salvate.
2. Per ogni incantesimo, leggere la voce nel PDF e registrare tutti i campi
   strutturati, il testo descrittivo e il riferimento alla **pagina stampata
   del Manuale**. Mostrare tale pagina accanto ai dettagli nell'app, così che
   la fonte di ogni descrizione sia rintracciabile. Verificare visivamente le
   tabelle e le pagine in cui l'OCR è ambiguo. Non riempire campi incerti usando
   SRD o altre fonti.
3. Sostituire i dettagli e le sintesi SRD usati dall'interfaccia con i dati
   verificati del Manuale. Adeguare filtri per classe/livello, lancio,
   preparazione, slot, consumo e ogni effetto calcolato dall'app che dipende
   dagli incantesimi.
4. Migrare in modo compatibile i nomi degli incantesimi nelle schede esistenti.
   Conservare i dati personali e segnalare esplicitamente i valori che il PDF
   non consente di ricondurre con certezza.
5. Aggiungere controlli automatici: copertura integrale dell'indice, unicità
   dei nomi, campi obbligatori, riferimenti di pagina, assenza di testi SRD
   nell'interfaccia e prove delle logiche di gioco. Confrontare i risultati con
   le pagine del PDF prima di dichiarare conclusa la migrazione.

## Criterio di completamento

Nessun incantesimo selezionabile usa dati o descrizioni SRD come fonte di
regole; ogni voce e ogni logica associata sono state confrontate con il PDF e
ogni descrizione verificata conserva la sua pagina del Manuale.
Le schede precedenti restano leggibili e i test pertinenti passano. Eventuali
lacune o ambiguità del PDF sono documentate e sottoposte all'utente: non vengono
colmate con fonti esterne.
