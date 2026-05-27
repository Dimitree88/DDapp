# Schede D&D

App **mobile-first** privata per gestire le schede dei personaggi di D&D 5e (regole
2024) della nostra compagnia (6-10 giocatori). Ogni scheda si sfoglia con lo **swipe
orizzontale** ed è completamente **libera**: nessun calcolo automatico, tutti i campi
sono testo modificabile.

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

## Script
| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run db:push` | Applica lo schema Drizzle al DB |
| `npm run seed` | Inserisce il personaggio "Ephemer" |
| `npm run db:studio` | Apre Drizzle Studio sul DB |

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
Una sola tabella `characters`: `id`, `name`, `pin_hash`, e `data` (JSON con l'intera
scheda — vedi il tipo `Sheet` in `lib/sheet.ts`). La scheda originale di riferimento è
in `docs/EPHEMER.md`.

## Note
- `local.db` (DB locale) e `.env` sono ignorati da git.
- I dettagli per chi sviluppa con un agente AI sono in `AGENTS.md`.
