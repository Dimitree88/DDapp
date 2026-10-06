# Campi modificabili nella scheda del giocatore

Fotografia dell'interfaccia e del salvataggio ordinario al 6 ottobre 2026. Questo documento descrive lo stato dell'app, non stabilisce regole di gioco. Prima di usarlo per una nuova modifica, ricontrollare il codice; per le regole vale solo `docs/regole/Manuale Del Giocatore - 2024.pdf`.

| Pagina | Modifiche disponibili al giocatore |
| --- | --- |
| Stato & Identità | Testo di **Note lingue**. |
| Armi | Registrare armature e scudi posseduti, aggiungerne o toglierne unità; scegliere l'armatura indossata tra quelle possedute; impugnare o togliere uno scudo posseduto; aggiungere o rimuovere armi dal catalogo e modificarne la quantità. Non si può togliere l'ultima unità di un'armatura o scudo in uso senza prima disequipaggiarlo. |
| Equipaggiamento | Aggiungere oggetti di catalogo o personalizzati, rimuoverli e modificarne la quantità. Nel popup di un oggetto si possono modificare il nome e il dettaglio personale. |
| Incantesimi | Modificare gli **slot incantesimo spesi** per ciascun livello disponibile, entro il massimo verificato dal salvataggio. L'elenco degli incantesimi e la caratteristica di lancio sono di sola lettura. |
| Monete | Modificare le quantità di rame, argento, electrum, oro e platino digitando il valore o usando i pulsanti `+` e `−`. |
| Appunti | Modificare il testo libero degli appunti. |

Le pagine **Caratteristiche**, **Abilità**, **Privilegi** e **Talenti** non offrono editor diretti. Anche competenze in armature, armi e strumenti, Padronanze, fonti delle competenze, lingue conosciute e usi delle risorse sono mostrati in sola lettura. Le modifiche future previste dalle regole appartengono ai flussi guidati descritti in [`PLAN_CAMBIO_LIVELLO.md`](../PLAN_CAMBIO_LIVELLO.md) e [`PLAN_MASTER_TOOLS.md`](../PLAN_MASTER_TOOLS.md); la presenza nei piani non significa che i flussi siano già implementati.

**Ambito della verifica:** la tabella elenca i controlli esposti nella pagina del giocatore. Non è una garanzia che ogni campo non mostrato sia bloccato dal server: per esempio, `saveSheet` non vieta esplicitamente una variazione dei PF attuali inviata fuori dall'interfaccia.

Riferimenti all'implementazione: [`CharacterClient.tsx`](../app/personaggio/[id]/CharacterClient.tsx), [`actions.ts`](../app/actions.ts), [`fields.tsx`](../components/fields.tsx).
