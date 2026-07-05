# Rebuild the cloud backend (Supabase)

FBSN was rebuilt as a **local-only** app on 2026-05-05 — no Supabase,
no Vercel, no external services required. Content that used to live in
database tables is now bundled JSON under `public/data/`. The
facilitator's own client/project/artifact records live in browser
localStorage.

If you ever want to bring back multi-device sync, real accounts, or the
multiplayer virtual-session feature, this doc is the path. All the old
SQL files are preserved under `backend-archive/`.

## What lives where today

| Data | Now | Was |
|---|---|---|
| Beliefs (5 principles) | `public/data/beliefs.json` (read-only) | `beliefs` table |
| Practices (16 per-play) | `public/data/practices.json` (read-only) | `practices` + `play_practices` tables |
| Resources (built-in) | `public/data/resources.json` (read-only) | `resources` table (seed rows) |
| Resources (user-added) | `localStorage['fbsn:local:resources-local']` | `resources` table (fresh rows) |
| Clients | `localStorage['fbsn:local:clients']` | `clients` table |
| Projects | `localStorage['fbsn:local:projects']` | `projects` table |
| Artifacts | `localStorage['fbsn:local:artifacts']` | `artifacts` table |
| Stage tasks | `localStorage['fbsn:local:stage-tasks']` | `stage_tasks` table |
| Auth | none (single implicit "Facilitator" user) | Supabase Auth + `fbsn_profiles` |
| Multiplayer rooms | (removed) | `rooms` + `participants` + `votes` |

Everything is glued together by two files:

- **`public/local-store.js`** — exposes `window.dataStore` with the
  read/write API for JSON + localStorage.
- **`public/supabase-shim.js`** — a compatibility layer so any
  `sb.from('X').select/insert/update/delete/eq/order/single/...` calls
  still route into `dataStore`. `clients.html` still uses this style;
  `resources.js` and `practices.js` were rewritten to call `dataStore`
  directly.

`public/auth.js` is a no-op stub that hard-codes a single admin/Facilitator
user so anywhere in the code that reads `window.VCTUser` or calls
`VCTAuth.isAdmin()` keeps working.

## To bring Supabase back

### 1. Create a Supabase project

Free tier is fine. Copy your project URL and anon public key from
**Settings → API**.

### 2. Run the SQL migrations

Everything in `backend-archive/` is idempotent. From the SQL Editor,
run these files in order:

1. `supabase-schema.sql` (rooms / participants / votes — only needed
   if you want multiplayer back)
2. `content-schema.sql` (content overrides — the old admin inline
   editor; not required if you're happy with static text)
3. `beliefs-schema.sql`
4. `practices-schema.sql`
5. `resources-schema.sql`
6. `resources-thumbnail-migration.sql`
7. `auth-clients-schema.sql` (creates `fbsn_profiles`, `clients`,
   `projects`, `artifacts`, `stage_tasks`, invite codes, and the
   signup trigger)
8. `participant-prompts-migration.sql` (multiplayer only)
9. `room-locked-prompts-migration.sql` (multiplayer only)

The convenience bundle `all-migrations.sql` concatenates them.

### 3. Wire Supabase into the app

Add a real supabase-config.js back:

```js
// public/supabase-config.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
var SUPABASE_URL      = 'https://<project-ref>.supabase.co';
var SUPABASE_ANON_KEY = 'eyJ...';
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.generateRoomCode = function () {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = '';
  for (var i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
};
```

Then on every HTML page, replace:

```html
<script src="local-store.js"></script>
<script src="supabase-shim.js"></script>
<script src="auth.js"></script>
```

with:

```html
<script src="auth.js"></script>
<script type="module" src="supabase-config.js"></script>
<script src="admin.js"></script>
```

Delete (or move aside) `local-store.js` and `supabase-shim.js` so nothing
falls through to the shim.

### 4. Bring real auth back

Restore the old versions of these files from git history (search for
the `Rip out Supabase, host locally` commit and revert):

- `public/auth.js` — the Supabase session-check version
- `public/login.html`
- `public/confirm.html`
- `public/admin-console.html`
- `public/admin.js` — the content-overrides + user-badge version

Then in Supabase → **Authentication → URL Configuration**, add your
site URL and `<domain>/confirm.html` as an allowed redirect.

### 5. Bring multiplayer back (optional)

Restore from git:

- `public/host.html`
- `public/join.html`
- `public/test-harness.html`

Add the mode-selector card back on `fbsn.html` (see git history around
the `Rip out Supabase` commit for the exact markup).

`server.js` used to be a WebSocket relay for a different, pre-Supabase
multiplayer path; it isn't required — the Supabase-realtime multiplayer
lives entirely in `host.html` / `join.html`.

### 6. Migrate your local data (optional)

Before switching wiring, dump your local records to JSON in the browser:

```js
copy(JSON.stringify(dataStore.exportAll()));
```

That gives you an object with `clients`, `projects`, `artifacts`,
`resources-local`. After Supabase is live, insert those rows manually
via the SQL editor (or a small one-off script).

## Deployment (Vercel etc.)

The app used to deploy to Vercel with the `api/` folder as serverless
functions. That's been consolidated into a plain Node HTTP server
(`server.js`) so you can host anywhere that runs Node 18+ — your own
machine, a Fly.io VM, a Raspberry Pi. To go back to Vercel:

1. Re-add `vercel.json` at the repo root
2. Split `server.js` back into `api/extract.js`, `api/factcheck.js`,
   `api/cynefin.js` handlers using the `export default async function
   handler(req, res)` shape
3. `git push` — Vercel picks it up

Again, the git history for `Rip out Supabase, host locally` has the
original serverless-function shape.
