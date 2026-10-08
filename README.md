# Schede D&D

App **mobile-first** privata per gestire le schede dei personaggi di D&D 5e (regole
2024) della nostra compagnia (6-10 giocatori). Ogni scheda si sfoglia con lo **swipe
orizzontale** e calcola modificatori, bonus competenza, tiri salvezza, abilità,
Iniziativa (con il talento Allerta) e Percezione passiva. La maggior parte degli altri campi è testo libero; scudo,
ispirazione eroica e C/R/M sono spunte, mentre classe
armatura e velocità sono numeri con note separate. Classi, sottoclassi, specie,
lignaggi, background, lingue, allineamenti, taglie, armi, talenti e livelli degli
incantesimi usano i domini del catalogo JSON.

I personaggi vengono creati manualmente, fuori dall'interfaccia. Classe, Specie,
Lignaggio, Background e Taglia di base sono bloccati; Sottoclasse,
talenti, lingue e competenze già acquisiti non possono essere rimossi o sostituiti.
Le correzioni alle scelte fisse si eseguono direttamente nel database. Le schede esistenti sono state marcate come formate
con `node --import tsx scripts/migrate-creation-lock.mjs --apply`.
Etichetta e valore aprono la stessa spiegazione specifica per le voci di catalogo
presenti nella scheda; i valori derivati mostrano anche la formula. Le armi mostrano
danni, proprietà e padronanza. Gli oggetti riconosciuti mostrano le regole disponibili
e gli eventuali dettagli personali. Il doppio tocco sul valore continua a modificarlo.

## Stack
- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Tailwind CSS v4**
- **Embla Carousel** (navigazione a pagine in swipe)
- **Drizzle ORM** + **libSQL / Turso** (in locale un file SQLite; in produzione Turso)
- Hosting previsto: **Vercel** (free tier)

## Avvio in locale
Requisiti: Node 22+.

```bash
# 1. Installa le dipendenze
npm install

# 2. Crea il file .env.local (ignorato da Git)
DATABASE_URL="file:local.db"
DATABASE_AUTH_TOKEN=""
SESSION_SECRET="<stringa lunga e casuale>"

# 3. Crea lo schema usando le migration versionate (solo SQLite locale)
npm run db:migrate:local

# 4. Carica personaggi, creatura e Sessione dimostrativi fittizi
npm run db:seed:demo # PIN dei personaggi demo: 0000

# 5. Avvia il server di sviluppo
npm run dev
```

Se hai già un `local.db` creato con il vecchio `db:push`, conserva quel file e
registra la base dello schema precedente una sola volta:
`npm run db:baseline:local`. Il comando controlla le tabelle, colonne e indici
preesistenti prima di scrivere il registro, senza modificare le schede; se la
vecchia tabella eventi Master esiste già, aggiunge anche il riferimento
opzionale alla creatura mancante.
Subito dopo esegui `npm run db:migrate:local`: la migration incrementale crea
le tabelle Master mancanti. Su un database vuoto, `db:migrate:local` applica
entrambe le migration; quella incrementale usa `IF NOT EXISTS` ed è sicura
anche se le tabelle Master esistono già.

Per aggiungere una modifica allo schema: aggiorna `lib/db/schema.ts`, esegui
`npm run db:generate -- --name=descrizione_breve`, controlla il file SQL
generato in `drizzle/` e committa insieme migration, journal e snapshot.
Durante lo sviluppo locale usa `db:migrate:local`; `db:push` non registra
migration riproducibili e non fa parte del normale flusso.

Il seed demo contiene solo dati sintetici: quattro personaggi e una creatura,
con `Test` in fondo al nome, oltre a una Sessione aperta quando non ne esiste
già un'altra. È idempotente e aggiorna i nomi dei record demo già presenti
senza riscriverne le schede. I database locali non vengono copiati nel
repository e questi comandi rifiutano URL remoti o token Turso.
La pagina **Master** (`/master`) è pensata per telefono e tablet. Con una Sessione
aperta mostra il **Tavolo** (righe compatte con PF, CA, stati e pulsanti −/+ che
aprono un tastierino), il tracker d'iniziativa con round e turni, la tabella del
**Gruppo**, il **Registro** con «Annulla» e gli **Appunti**. Dal menu «Altro» si
avviano riposi di gruppo, PE, aggiunta di partecipanti, la libreria delle creature
(con editor di valori, caratteristiche, attacchi e tratti), la chiusura e
l'eliminazione. «⚔ Combattimento» apre lo strumento che aggiunge i nemici (dalla
libreria o rapidi, con numerazione automatica), raccoglie le iniziative con un
solo tiro per i gruppi uguali e mostra la classifica dei turni; a fine scontro
toglie i nemici sconfitti e propone i loro PE. «Più bersagli» applica danni ad
area (metà a chi supera il TS), cure o condizioni a più creature insieme. I PE si
assegnano a testa, divisi o portando tutti alla soglia del livello successivo.
Quando i PE bastano il Master vede «⬆ Livello N pronto» e il giocatore trova
«Sali di livello» nella propria scheda: il passaggio guidato, fatto dal
giocatore, chiede PF, sottoclasse, talento, maestria, lingue, incantesimi (con
descrizione dal manuale) e padronanze secondo le tabelle di classe verificate
(`lib/levelUp.ts`, prove in `scripts/test-level-up.mjs`).
Le Sessioni chiuse si riaprono o si eliminano dall'archivio;
eliminare una Sessione cancella registro e appunti, non le modifiche già applicate
alle schede. I partecipanti si scelgono alla creazione e si possono aggiungere o
togliere anche a Sessione aperta. Le regole applicate (danni, 0 PF, tiri contro
morte, concentrazione, PE, riposi) sono in `lib/masterRules.ts` con le pagine del
manuale; le prove sono in `scripts/test-master-rules.mjs`.

Prima del deploy applica al database di produzione la migration
`drizzle/0002_master_session_notes_encounter.sql` (colonne `notes` ed `encounter`
di `master_sessions`).

Apri **http://localhost:3000**. Per provarla dal telefono (stessa rete Wi-Fi) usa
l'indirizzo **Network** stampato all'avvio (es. `http://192.168.1.222:3000`).

## Come si usa
- La home elenca i personaggi della compagnia. Toccane uno per vederlo (sola lettura).
- Per modificare: pulsante **Modifica** → inserisci il **PIN a 4 cifre** della scheda
  → modifichi i campi → **Salva modifiche**.
- Crea un nuovo personaggio dal form in fondo alla home (nome + PIN).
- Dalla pagina del personaggio puoi esportare il PDF nel formato dell'app o
  compilare il modello D&D originale. Il secondo PDF è statico e contiene fino a
  6 armi e 30 incantesimi; i testi troppo lunghi vengono tagliati solo nel PDF.
- Il pulsante **Storico modifiche** in fondo alla pagina del personaggio mostra le
  modifiche manuali alle pagine della scheda, con data, ora e valori prima/dopo.
  La sezione **Storia** mostra creazione e avanzamenti.

## Script
| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run db:push` | Push schema non versionato (strumento legacy; non usare nel flusso normale) |
| `npm run seed` | Inserisce il personaggio "Ephemer" |
| `npm run db:generate -- --name=nome` | Genera una migration Drizzle versionata |
| `npm run db:migrate:local` | Applica le migration al SQLite indicato da `.env.local` |
| `npm run db:baseline:local` | Registra la base dello schema precedente su un DB locale esistente, senza riscrivere dati |
| `npm run db:seed:demo` | Inserisce i dati sintetici della pagina Master nel DB locale |
| `npm run db:studio` | Apre Drizzle Studio sul DB |
| `node scripts/setup-history.mjs` | Crea la tabella dello storico senza cambiare le schede |

## Variabili d'ambiente
| Variabile | Locale | Produzione (Turso) |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` | `libsql://<db>-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | (vuoto) | token Turso |
| `SESSION_SECRET` | stringa casuale | stringa casuale (diversa) |

## Deploy su Vercel (da fare)
1. Crea un database su [Turso](https://turso.tech) e ottieni URL + auth token.
2. Imposta su Vercel le 3 variabili d'ambiente (vedi tabella).
3. Applica le migration versionate con una procedura di deploy autorizzata.
   Su un database già popolato, non eseguire la migration iniziale come se fosse
   un database vuoto: verifica/baseline dello schema esistente, poi applica
   `drizzle/0001_master_session_tables.sql`. È additiva e non modifica le
   schede esistenti. Se `master_session_events` esiste già senza la colonna
   `creature_id`, dopo aver verificato le colonne esegui una sola volta
   `ALTER TABLE master_session_events ADD COLUMN creature_id text REFERENCES creatures(id);`.
   Le migration `*:local` rifiutano URL remoti; non puntare mai il seed demo a
   Turso. Per tornare al codice precedente basta il rollback del deploy: le
   nuove tabelle possono restare vuote senza impatto.
4. Collega il repo a Vercel e fai il deploy.

## Modello dati
La tabella `characters` contiene `id`, `name`, `pin_hash` e `data` (JSON con l'intera
scheda — vedi il tipo `Sheet` in `lib/sheet.ts`). `character_history` registra
data, ora e differenze delle modifiche manuali alla scheda. La scheda originale di riferimento è
in `docs/EPHEMER.md`.

## Catalogo delle regole

Le opzioni dei menu sono in [`lib/manuale-2024-domains.json`](lib/manuale-2024-domains.json), ricavate dal PDF locale del Manuale del Giocatore 2024.
Puoi aggiungere o modificare le voci direttamente nel file; la modifica richiede
un nuovo deploy in produzione. I campi con dominio accettano solo valori presenti
nel JSON. I dati esistenti devono quindi essere allineati al catalogo prima di
rimuovere o rinominare una voce. `node scripts/audit-domain-values.mjs` legge i
valori attuali; `node scripts/normalize-domain-values.mjs` simula la bonifica e
`node scripts/normalize-domain-values.mjs --apply` la applica, creando prima un
backup locale ignorato da Git in `.db-backups/`. Gli script leggono `.env.local`.

**Regole adottate dalla campagna:** D&D quinta edizione revisionata 2024
(talvolta chiamata «5.5»). L'unica fonte per regole, logiche, domini dati,
cataloghi e descrizioni di gioco è il PDF locale
[`docs/regole/Manuale Del Giocatore - 2024.pdf`](docs/regole/Manuale%20Del%20Giocatore%20-%202024.pdf).
Non cercare regole o riferimenti su Internet o in altre fonti, salvo richiesta
esplicita dell'utente. I cataloghi e i documenti storici del repository non
sostituiscono il PDF; in caso di divergenza prevale il PDF. Se il manuale non
chiarisce un dato necessario, chiedere indicazioni all'utente.

## Note
- `local.db` (DB locale) e `.env` sono ignorati da git.
- I dettagli per chi sviluppa con un agente AI sono in `AGENTS.md`.
