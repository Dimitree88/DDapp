# Questo NON è il Next.js che conosci

Next.js 16 ha breaking changes: API, convenzioni e struttura dei file possono
differire dai dati di training. Leggi la guida pertinente in
`node_modules/next/dist/docs/` prima di scrivere codice. Rispetta gli avvisi di deprecazione.

# Schede D&D — contesto per l'agente

> Questo file è la **fonte di verità** del progetto. La memoria automatica di Claude
> è legata al percorso della cartella: se la cartella viene rinominata riparte vuota,
> quindi tutto il contesto necessario deve stare qui.

## Cos'è
App **mobile-first privata** per registrare le schede di D&D 5e (regole 2024) di un
gruppo di amici (6-7 giocatori, max 10). Lingua UI: **italiano**. Hostata su
**Vercel (free tier)**. NON è un'app pubblica.

## Decisioni di design (il "perché" — rispettarle)
- **Nessuna automazione né calcoli di regole.** Ogni campo è **testo libero**
  modificabile. Scelta esplicita dell'utente: niente validazioni, niente calcoli di
  modificatori/bonus secondo le regole D&D, salvo richiesta esplicita.
- **Scala piccola e privata** → niente auth pesante.
- **Accesso a PIN per personaggio:** tutti vedono tutte le schede in sola lettura;
  per modificare una scheda si inserisce il **PIN a 4 cifre** di quel personaggio.
  Lo sblocco è un cookie firmato HMAC (`unlock_<id>`). Ognuno modifica solo la propria.
- **UX a pagine con swipe orizzontale** (Embla), ~10 pagine, poche info per pagina,
  scroll verticale dentro ogni pagina.
- **Tema "scheda su pergamena":** font serif TT Jenevers, sfondo pergamena, inchiostro
  scuro su carta, accento oxblood (`#7a2618`). I colori sono token Tailwind definiti in
  `app/globals.css` (`ink`, `card`, `line`, `accent`, `parchment`…).

## Stack
Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS v4 ·
Embla Carousel · Drizzle ORM · **libSQL/Turso** (un unico DB cloud su Turso:
anche l'ambiente locale si collega a quello).

## Mappa dei file
- `lib/sheet.ts` — tipo `Sheet` (modello scheda) + `emptySheet()` con scheletro
  standard di caratteristiche/abilità D&D.
- `lib/db/schema.ts` — tabella Drizzle `characters` (`id`, `name`, `pin_hash`,
  `data` JSON = `Sheet`, timestamps).
- `lib/db/index.ts` — client Drizzle su libSQL (legge `DATABASE_URL`/`DATABASE_AUTH_TOKEN`).
- `lib/auth.ts` — hashing PIN (scrypt) + firma/verifica cookie di sblocco (HMAC, `SESSION_SECRET`).
- `app/actions.ts` — server actions: `createCharacter`, `unlock`, `lock`, `saveSheet`.
- `app/layout.tsx` — root layout: carica i font TT Jenevers via `next/font/local`.
- `app/globals.css` — palette pergamena (token Tailwind) + sfondo fisso (`body::before`).
- `app/page.tsx` — landing: elenco personaggi + form nuovo personaggio.
- `app/personaggio/[id]/page.tsx` — server component: carica scheda + calcola `canEdit`.
- `app/personaggio/[id]/CharacterClient.tsx` — client: carosello Embla, le ~10 pagine,
  editing, salvataggio, modale PIN.
- `components/fields.tsx` — `TextField`, `InlineInput`, `Toggle` (editabile vs sola lettura).
- `fonts/` — TT Jenevers, 4 pesi `.otf` (Regular, Bold, Medium Italic, Bold Italic).
- `public/background.webp` — sfondo pergamena ottimizzato (~88 KB).
  Sorgente: `images/background.png` (~10 MB, 3840×2551 — non committare in git).
- `scripts/seed.ts` — inserisce il personaggio "Ephemer" dai dati di `docs/EPHEMER.md`.
- `docs/EPHEMER.md` — scheda originale dell'utente (riferimento per il modello dati).
- `drizzle.config.ts` — dialect `sqlite` se `file:`, altrimenti `turso`.

## Come girare in locale
Il locale è collegato **direttamente al DB di produzione (Turso)** — non c'è più un
DB SQLite locale. `.env` (gitignored) contiene:
```
DATABASE_URL="libsql://…turso.io"     # endpoint Turso
DATABASE_AUTH_TOKEN="<token Turso>"   # segreto, mai committare
SESSION_SECRET="<stringa casuale>"    # firma i cookie di sblocco (per-dominio)
```
Avvia: `npm run dev` → http://localhost:3000 (dal telefono, stessa Wi-Fi, usa l'URL
"Network" stampato all'avvio).

> ⚠️ **Attenzione:** lavorando in locale leggi/scrivi sui **dati reali** di produzione.
> Anche `npm run db:push` agirebbe sullo schema Turso. PIN di Ephemer: **0000**.

> Nota: gli script in `package.json` invocano `node node_modules/<pkg>/...` (path
> relativi) invece di `next dev`/`drizzle-kit push`/`tsx`. Workaround storico per un
> `&` nel vecchio nome cartella che rompeva `npm run` su Windows; oggi è innocuo.

## Deploy (in produzione)
- **Live:** https://dd-app-nine.vercel.app — host **Vercel**, repo GitHub
  `Dimitree88/DDapp` (**pubblico**: solo codice; segreti e dati restano fuori).
- **Auto-deploy:** ogni push su `main` ri-deploya in automatico.
- **DB:** Turso (libSQL cloud). Schema spinto con `db:push` e Ephemer seminato.
- **Env su Vercel** (valori NON qui — il repo è pubblico): `DATABASE_URL`,
  `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`. Vanno impostati prima del build (l'app
  legge il DB all'avvio, altrimenti il build fallisce). Sono gli stessi valori del
  `.env` locale (a parte `SESSION_SECRET`, che in locale è quello di sviluppo).

## Stato attuale / prossimi passi
- ✅ Scheletro funzionante: landing, scheda con 10 pagine in swipe, PIN unlock/save,
  Ephemer seminato.
- ✅ Tema pergamena applicato (font TT Jenevers + sfondo + palette).
- ✅ **Deployato** su Vercel + Turso; produzione verificata (landing legge Ephemer dal DB).
- ⏳ Eventuale feedback UX sullo swipe/mobile; aggiungere gli altri personaggi.
- Non verificato in modo headless: resa visiva reale, swipe col dito, modale PIN,
  salvataggio dal browser (l'utente li prova manualmente).

## Convenzioni
- UI e testo in **italiano**.
- Campi sempre liberi (testo); non introdurre logica di regole.
- Mantenere la semplicità adatta a pochissimi utenti e al free tier.
