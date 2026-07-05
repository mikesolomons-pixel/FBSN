# Rebuild multiplayer (Supabase virtual sessions)

Multiplayer virtual sessions — the facilitator hosting a room, participants
joining from phones via QR code, live voting on perspectives — was
**deactivated on 2026-05-05** in favor of solo-only mode.

The code is still present. This doc is the step-by-step to turn it back on
using a fresh (or existing) Supabase project.

---

## What was gated off

Everything is behind a single feature flag in `public/feature-flags.js`:

```js
window.FBSN_FLAGS = {
  multiplayer: false   // ← flip to true
};
```

When `multiplayer` is `false`:

- `.multiplayer-only` DOM elements are hidden via a CSS injection in
  `feature-flags.js`. This covers:
  - The **Host Virtual Session** / **Join Virtual Session** mode cards
    on `fbsn.html`
  - The **Host as Virtual Session** button next to the Netflix example
  - The two **Host Virtual Session** CTAs on `fbsn-tutorial.html`
- The admin badge (`admin.js`) hides the **Test Harness** button
- Direct hits to `/host.html`, `/join.html`, `/test-harness.html`
  redirect to `fbsn.html` (via `feature-flags.js`)

Nothing was deleted. Everything comes back the moment the flag is flipped
back to `true` — **provided a working Supabase backend exists.**

---

## Step 1 — Flip the flag

Edit `public/feature-flags.js`:

```js
window.FBSN_FLAGS = {
  multiplayer: true
};
```

That alone unhides the buttons and stops the redirect, but the actual
multiplayer flows will error until Steps 2–5 are done.

---

## Step 2 — Point at a Supabase project

Edit `public/supabase-config.js` and replace both values with your
project's URL and anon key (Supabase Dashboard → Project Settings → API):

```js
var SUPABASE_URL      = 'https://<your-project-ref>.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR...';   // anon public key
```

If you're re-using the shared Mise En Place project, this file already
points there — skip this step.

---

## Step 3 — Run the SQL migrations

Open the SQL Editor in the Supabase Dashboard and run these files from the
repo root **in order**. All are idempotent — safe to re-run on an existing
project.

Required for multiplayer:

1. **`supabase-schema.sql`** — creates `rooms`, `participants`, `votes`,
   RLS policies, realtime publication, and indexes.
2. **`participant-prompts-migration.sql`** — creates the atomic
   `append_room_perspective`, `update_room_perspective`, and
   `delete_room_perspective` RPC functions (perspectives-as-objects model
   with per-submitter identity).
3. **`room-locked-prompts-migration.sql`** — adds the
   `allow_participant_prompts` column so template-based sessions can
   disallow participant submissions.

Required for facilitator auth (host must be logged in as a
`practitioner` or `admin` to hit `/host.html`):

4. **`auth-clients-schema.sql`** — creates `fbsn_profiles`, `invite_codes`,
   plus the `handle_new_user()` trigger that populates a profile row on
   Supabase Auth signup. (Also creates the `clients`, `projects`,
   `artifacts`, `stage_tasks` tables — those aren't needed for
   multiplayer but ship together.)

The `all-migrations.sql` bundle at the repo root concatenates 1, 3, and
the other feature schemas; you can paste that whole file as a shortcut.

---

## Step 4 — Auth URL configuration

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** the domain you host the app at (e.g. `https://fbsn-app.vercel.app`)
- **Redirect URLs:** add these entries so signup / password reset emails
  land back on the app:
  - `https://<your-domain>/confirm.html`
  - `https://<your-domain>/**`
  - `http://localhost:3000/confirm.html`
  - `http://localhost:3000/**`

If the Supabase project is shared with another app that owns the Site
URL, leave that alone — FBSN's signup code passes `emailRedirectTo`
explicitly, so it only needs its redirects in the allow-list.

---

## Step 5 — Create your admin user

1. Visit `/login.html` on the live app, click **Sign Up**, and use invite
   code **`VCT-ADMIN-2024`** (seeded by `auth-clients-schema.sql`). Fill
   your name, email, password.
2. Confirm your email via the link Supabase sends you.
3. If your email already exists in `auth.users` from a previous project,
   promote it to admin manually:
   ```sql
   insert into fbsn_profiles (id, email, full_name, role)
   values ((select id from auth.users where email='you@example.com'),
           'you@example.com', 'Your Name', 'admin')
   on conflict (id) do update set role='admin';
   ```

---

## Step 6 — Smoke test

1. Go to `/host.html`. You should see the setup form (or the resume
   banner if a stored session exists in localStorage).
2. Click **Start Session** with any title. You should get to the waiting
   screen with a QR code.
3. In another tab (or phone), open `/join.html?code=<CODE>`, enter a
   name, click **Join**. You should appear in the facilitator's
   participant list within a couple seconds (Supabase realtime).
4. Add a perspective from the participant side. It should show up in
   the facilitator's live list with "by <name>".
5. On the facilitator side, click **Begin Exercise**, walk through a
   perspective, click **Reveal Votes**, confirm the majority — all
   should sync.
6. Visit `/test-harness.html` (admin-only). Click **Create test room**.
   You should get one host pane + three auto-joined participants
   (Alice / Bob / Carol) in iframes.

If any of these fail:

- **Table not found** → a migration didn't run. Re-run the failing file.
- **Empty realtime updates** → check that `rooms`, `participants`, and
  `votes` are in the `supabase_realtime` publication (the schema file
  does this — verify in Supabase → Database → Replication).
- **"Could not find the function public.append_room_perspective..."** →
  the RPC signature is stale. Drop the old function and re-run
  `participant-prompts-migration.sql`:
  ```sql
  drop function if exists public.append_room_perspective(uuid, text);
  drop function if exists public.append_room_perspective(uuid, text, uuid);
  -- then re-run the migration
  ```
- **Invite code invalid** → confirm `select * from invite_codes;` returns
  rows. If empty, the seed statement in `auth-clients-schema.sql` didn't
  run — re-run that file.

---

## Files involved (for reference)

Client-side (only opens up when flag is on):

- `public/feature-flags.js` — the flag itself
- `public/host.html` — facilitator view
- `public/join.html` — participant view
- `public/test-harness.html` — admin multiplayer test bench
- `public/fbsn.html` — mode selector + Netflix Host CTA (gated by class)
- `public/fbsn-tutorial.html` — Host CTAs (gated by class)
- `public/admin.js` — Test Harness button in admin badge (gated in JS)

Server-side:

- `supabase-schema.sql` — rooms / participants / votes tables + realtime
- `participant-prompts-migration.sql` — perspective append/update/delete RPCs
- `room-locked-prompts-migration.sql` — `allow_participant_prompts` column
- `auth-clients-schema.sql` — `fbsn_profiles` + signup trigger + invite codes
- `all-migrations.sql` — convenience bundle

There is no separate build step or bundler — Vercel serves `/public/*`
directly. Push the flag flip to `master` and it goes live on the next
Vercel deploy.
