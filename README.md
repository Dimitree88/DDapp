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

# 2. Crea il file .env (vedi .env.example)
#    DATABASE_URL="file:local.db"
#    SESSION_SECRET="<stringa lunga e casuale>"

# 3. Crea lo schema del DB locale
npm run db:push

# 4. (opzionale) Carica il personaggio di esempio "Ephemer"
npm run seed        # PIN di Ephemer: 0000

# 5. Avvia il server di sviluppo
npm run dev
```

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
- Il pulsante **Storico modifiche** in fondo alla pagina del personaggio mostra i
  salvataggi in ordine dal più recente, con data, ora e valori prima/dopo. I
  salvataggi identici non creano voci. Lo storico inizia dall'attivazione della
  funzione; le modifiche precedenti non sono ricostruibili dal database.

## Script
| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run db:push` | Applica lo schema Drizzle al DB |
| `npm run seed` | Inserisce il personaggio "Ephemer" |
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
3. Esegui una volta `npm run db:push` puntando al DB Turso (con le env di produzione).
4. Collega il repo a Vercel e fai il deploy.

## Modello dati
La tabella `characters` contiene `id`, `name`, `pin_hash` e `data` (JSON con l'intera
scheda — vedi il tipo `Sheet` in `lib/sheet.ts`). `character_history` registra
data, ora e differenze di ogni salvataggio effettivo. La scheda originale di riferimento è
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
