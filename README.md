# VtM Character Sheets

A web app for *Vampire: The Masquerade* character sheets: build a character with a
guided wizard, keep the sheet, roll dice by the rules, export to PDF, and share a
live read-only view with your storyteller.

Built around two extension points:

- **Game systems** are plugins. V20 is one implementation; new editions plug in
  by adding a folder and one registration line.
- **Languages** are data. RU/EN ship today; adding a locale is a registry entry
  plus translations, with graceful fallbacks.

**Stack:** Vite · React 19 · TypeScript · Tailwind v4 · Firebase (optional, lazy-loaded).

---

## Develop

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm test      # unit tests (dice engine + creation validators)
pnpm build     # typecheck + production build → dist/
```

The app runs **fully local/offline** with no configuration — sign-in and cloud
sync simply don't appear until Firebase is configured (see [Cloud](#cloud-optional)).

---

## Features

- Full V20 sheet: 9 attributes, 30 abilities, disciplines, backgrounds, virtues,
  derived Humanity/Willpower/Blood Pool, health track (bashing/lethal/aggravated).
- Creation wizard: 9 data-driven steps with live budget validation (7/5/3,
  13/9/5, freebies ≤ 15) and clan-scoped discipline picks.
- Dice roller with V20 rules (successes, botches, specialty doubles 10s) + history.
- Multiple characters per device; player dashboard with cards.
- RU/EN throughout, switchable anywhere.
- Vector **PDF export** (one A4 page).
- Cloud (optional): Google sign-in, per-character Firestore sync, and a read-only
  **storyteller snapshot** via share link.

Routes (query-based, GitHub-Pages friendly):
`/` dashboard · `/?c=<id>` sheet · `/?view=<uid>/<charId>` storyteller (read-only).

---

## Architecture

```text
src/
  systems/            Plugin layer
    types.ts            GameSystem contract + Trait/RollResult/WizardStep…
    registry.ts         register() / getSystem() / listSystems()
    index.ts            registers every system (the only place that imports them)
    v20/                Vampire V20 as a GameSystem (data, labels, rules, dice,
                        character factory, creation steps)
  i18n/               Multilingual core
    lang.ts             Lang type, AVAILABLE_LANGS, localize()/tr() with fallbacks
    ui.ts               app-chrome strings; I18nContext.tsx provides t()/name()
  domain/             Generic Character model, SystemContext, useCharacter (autosave)
  store/              localStorage layer + multi-character index
  cloud/              Firebase (lazy SDK), auth, write-only sync, login list-pull
  components/         Generic, system-driven UI: Sheet, Wizard, Dice, tracks, …
  screens/            Dashboard, SheetScreen, StorytellerView
  pdf/                @react-pdf/renderer vector export (lazy-loaded)
  styles/index.css    Design tokens (Tailwind theme) — the visual design is final
```

**Rule:** components never import a concrete system. They call `useSystem()` and
render from `system.attributes`, `system.rules.*`, `system.dice.rollPool`, etc.
Each `Character` stores its `systemId`, so the app loads the right system per sheet.

### Add a game system

1. Create `src/systems/<id>/` mirroring `v20/` (`data`, `labels`, `rules`, `dice`,
   `character`, `creation`), and assemble a `GameSystem` in `<id>/index.ts`.
2. `register(mySystem)` in `src/systems/index.ts`. Done — it appears everywhere.

VtM editions share the generic `Character` shape and differ only in catalogs,
rules, and creation budgets.

### Add a language

1. Add an entry to `AVAILABLE_LANGS` in `src/i18n/lang.ts` (code, name, fallback chain).
2. Add strings to `src/i18n/ui.ts` (app chrome) and each system's `labels`.
3. Add the code to trait `name` maps where you want translations.

Missing strings fall back through the chain (e.g. `uk → ru → en`), so partial
translations never crash — they show the fallback.

---

## Cloud (optional)

Enables Google sign-in, per-character sync, and storyteller share links.

1. Copy `.env.example` → `.env.local` and fill the Firebase web config
   (Firebase console → Project settings → Web app). It's public-safe; the OAuth
   **client secret is never used and must not be committed.**
2. **Firebase → Authentication → Get started**, enable **Google**, and add your
   origins to **Authorized domains** (`localhost` + your deploy domain).
3. **Google Cloud → Credentials → OAuth client → Authorized JavaScript origins:**
   add `http://localhost:5173` and your deploy origin.
4. Deploy `firestore.rules` (Firestore → Rules).

### Sync model

Local storage is the source of truth; the cloud mirrors it economically:

- **Write:** on leaving the sheet (per session) — single device is the common
  case. While "live sharing" is on, also at most once every ~5s so a storyteller
  who reloads sees fresh data.
- **Read:** one-shot on open / reload — no live subscriptions. The storyteller
  view is an explicit snapshot labelled "version as of …" with a refresh button.
- On sign-in, the character list is pulled from Firestore so a fresh device
  discovers your characters.

Share links use public reads (`firestore.rules`): anyone with `?view=<uid>/<charId>`
can read that character. Writes are owner-only.

---

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` runs typecheck + tests on every push/PR and deploys
`main` to Pages. It builds with `VITE_BASE=/<repo>/` and injects the Firebase
config from repository **Secrets** (`VITE_FIREBASE_*`). Enable Pages → Source:
**GitHub Actions**. A `404.html` copy covers direct deep links.

---

## Not yet built (future iterations)

Chronicles (storyteller-owned groups + join links + party overview), storyteller
actions (give XP / deal damage), combat tracker, Google Drive backup.
