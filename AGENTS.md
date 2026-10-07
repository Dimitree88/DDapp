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

Per lo sviluppo locale seguire la sezione "Avvio in locale" del `README.md`: usare `npm run db:migrate:local` e `npm run db:seed:demo`, che richiedono `.env.local` con SQLite `file:` e token vuoto.

Le modifiche allo schema devono avere migration SQL e snapshot versionati in `drizzle/`; generarle con `npm run db:generate -- --name=...` e applicarle in locale con `npm run db:migrate:local`. Non usare `db:push` come normale flusso di sviluppo.

Non copiare database locali o dati reali nel repository. Per nuovi ambienti usare i fixture sintetici di `db:seed:demo`; per database locali preesistenti seguire la procedura di baseline nel README.

## Lavoro parallelo sul piano 2024

Per i task di `PLAN_ADEGUAMENTO_2024.md`, prima di modificare contenuti:

1. Su `main` pulito, fare `git pull --ff-only origin main` e rileggere `docs/adeguamento-2024/stato/<ID>.json` e le dipendenze.
2. Prendere soltanto un task `da_fare` con dipendenze `completato`: segnare `in_corso`, assegnatario, branch e ora UTC nel **suo** file di stato; committare soltanto quel file e fare subito push su `main`.
3. Iniziare il branch di lavoro soltanto dopo il push riuscito. Se il push è rifiutato, aggiornarsi e ricontrollare lo stato: non fare force push né iniziare un task già preso da un'altra AI.
4. Registrare pagine PDF, modifiche e prove in `docs/adeguamento-2024/evidenze/<ID>.md`. Seguire il protocollo di chiusura del piano per `pronto`, `completato` e `aperto`.
