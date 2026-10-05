# Fonte unica del progetto

Per ogni regola di D&D 2024, logica di gioco, dominio dati, voce di catalogo, descrizione, costo, peso, requisito, effetto e riferimento, usare **solo** `docs/regole/Manuale Del Giocatore - 2024.pdf` presente in questo repository.

- Verificare direttamente nel PDF locale il contenuto pertinente prima di aggiungerlo, correggerlo o descriverlo.
- Non cercare regole o riferimenti su Internet o in fonti esterne, inclusi SRD, altri manuali, siti e conoscenze ricordate, salvo richiesta esplicita dell'utente.
- Codice, JSON e documenti del repository descrivono lo stato dell'app, ma non sono fonti normative: se divergono dal PDF, prevale il PDF.
- Se il PDF non contiene o non chiarisce un'informazione necessaria, segnalarlo all'utente e chiedere indicazioni. Non colmare il vuoto con un'altra fonte.

Questa regola si applica a tutte le modifiche e verifiche relative ai contenuti di gioco del progetto.

## Note di sviluppo

- L'interfaccia è in italiano ed è pensata per l'uso mobile.
- Il progetto usa Next.js 16: prima di modificare API o convenzioni del framework, consultare la documentazione installata in `node_modules/next/dist/docs/`.
- Verificare la destinazione configurata prima di eseguire operazioni di scrittura sul database o modifiche allo schema.
