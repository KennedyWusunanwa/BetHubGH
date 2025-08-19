# Bet Hub GH — Frontend Prototype (MVP)

> Static HTML/CSS/JS prototype for a peer-to-peer betting UI. Runs on GitHub Pages or any static host.
> ⚠️ **Demo only** — no real funds or wallets. Logic is simplified for prototyping.

---

## Table of Contents

* [MVP Page Map](#mvp-page-map)
* [Prototype: What Works vs Simulated](#prototype-what-works-vs-simulated)
* [Project Overview](#project-overview)
* [App Structure](#app-structure)
* [Shared Code](#shared-code)
* [Data Model](#data-model)
* [Header & Navigation](#header--navigation)
* [Pages & Buttons (Full Walkthrough)](#pages--buttons-full-walkthrough)
* [Header — Mobile Behavior](#header--mobile-behavior)
* [Bet Lifecycle](#bet-lifecycle)
* [Local vs Remote (How It Functions)](#local-vs-remote-how-it-functions)
* [Deployment & Caching Tips](#deployment--caching-tips)
* [Troubleshooting](#troubleshooting)
* [UX Notes (Buttons)](#ux-notes-buttons)
* [GitHub + Supabase Guide](#github--supabase-guide)
* [Quick Start](#quick-start)
* [Supabase SQL (Tables + RLS)](#supabase-sql-tables--rls)
* [Publish on GitHub Pages](#publish-on-github-pages)
* [How the Front-End Works](#how-the-front-end-works)
* [Per-Page Summary](#per-page-summary)
* [Updating the Repo (Code)](#updating-the-repo-code)
* [Updating the Database](#updating-the-database)
* [Smoke Tests](#smoke-tests)
* [Common Errors & Fixes](#common-errors--fixes)
* [Changelog](#changelog)
* [Updating GitHub Pages + DB Together](#updating-github-pages--db-together)

---

## MVP Page Map

**Core MVP pages (6–7)**

* **Home** — Active/open bets, quick “Create/Join” CTAs.
* **Create Bet** — Yes/No or head-to-head; stake, expiry, outcome, resolver.
* **Bet Detail** — Outcome, time left, participants, stake, join button.
* **Portfolio/Dashboard** — Open bets, won bets, claimable rewards.
* **Onboarding / Connect Wallet** — MetaMask/WalletConnect (simulated), basic profile, geo-check (copy).
* **Dispute Resolution** — Challenge window, bond, resolver (simple MVP page).
* *(Optional)* **Notifications/Activity** — Alerts for joins, settlements, payouts.

**Supporting / legal (3–4)**

* **How It Works** (smart contracts, flow summary)
* **Terms & Conditions / Privacy**
* **Admin (internal, MVP-lite)** for dispute handling
* *(Optional)* **Browse/Discover** (separate from Home) for open bets

**Total**

* Essential MVP: **6–7 pages**
* With supporting/legal: **9–11 pages** total

---

## Prototype: What Works vs Simulated

### What works

* **Local “database”** — everything in `localStorage`. Balances, bets, disputes persist until you clear site data.
* **User profiles (Connect page)** — Create multiple demo users (each with a starting balance). Can mark one as **Admin**.
* **Create Bet** — Stake demo funds, choose type (**Yes/No** or **A vs B**), expiry, resolver.
* **Join Bet** — Another user can join and match.
* **Settle Bet** — Either:

  * **Auto** (random winner), or
  * **Admin** picks winner via the **Disputes** page.
* **Notifications** — Each user gets updates (e.g., “Bet matched”, “You won GHC 200”).
* **Balances** auto-update on join/settle.
* **Responsive UI** — Mobile / tablet / desktop.
* **Treasury & fees** — **1%** of every pot increments a fake treasury counter.
* **Disputes** — Any participant can raise; Admin resolves manually.
* **Navigation** — Header/footer on every page; active link highlight.

### What’s simulated

* No real blockchain or wallets — “wallet connect” is just a profile creator.
* “Smart contracts” logic is mocked in JS (escrow in `localStorage`).
* No real money/crypto (demo balances only).
* Security is **not** production-ready (demo/UI-UX only).

---

## Project Overview

A front-end prototype of a peer-to-peer betting UI for **Bet Hub GH**. Static site that supports two storage modes:

* **Local mode (default):** uses `localStorage` so data stays in your browser only (best for solo demos).
* **Remote mode (optional):** plug in **Supabase** (or Firebase) so everyone sees the same bets.

> ⚠️ **Demo only.** No real funds. Logic is simplified for prototyping.

---

## App Structure

```text
.
├── index.html           # Home
├── create.html          # Create Bet
├── bet.html             # Bet Detail
├── dashboard.html       # My Bets & Activity
├── connect.html         # Create/switch demo profile
├── disputes.html        # Admin dispute resolution
├── how-it-works.html    # Explainer
├── terms.html           # Legal note
├── css/
│   └── style.css
├── js/
│   ├── app.js           # Boots app, ensures header/footer, dynamic imports
│   ├── render.js        # Header/footer, bet cards, mobile nav
│   ├── utils.js         # Helpers (selectors, formatting, timers)
│   ├── db.js            # Data layer: localStorage or Supabase
│   ├── supabaseClient.js# (optional) URL + anon key
│   └── pages/           # Page-specific logic (home, create, bet, dashboard, connect, disputes)
└── assets/              # (optional) images, logo, etc.
```

---

## Shared Code

* `css/style.css` — Theme, responsive layout, mobile header/menu
* `js/app.js` — Ensures header/footer exist, dynamically imports `render.js`
* `js/render.js` — Renders header/footer, bet cards, mobile nav
* `js/utils.js` — Helpers: selectors, formatting, timers
* `js/db.js` — Data layer: **localStorage** version or **Supabase** version
* `js/supabaseClient.js` — Supabase URL + anon key (optional)
* `js/pages/*` — Page-specific logic

---

## Data Model

### User (session only)

Stored locally to know “who is using the UI”.

```json
{
  "id": "string",
  "username": "string",
  "addr": "string",
  "isAdmin": true,
  "balance": 1000
}
```

* **Local mode:** balance changes (create/join/settle) are simulated.
* **Remote mode:** balance still local (demo) unless you add a `users` table.

### Bet

Local (`localStorage`) or remote (Supabase):

```json
{
  "id": "uuid-or-string",
  "created_at": "ISO-or-epoch",
  "type": "YESNO | H2H",
  "outcome": "string",
  "stake": 100,
  "resolver": "AUTO | ADMIN",
  "creator_username": "string",
  "expires_at": "ISO-or-epoch",
  "status": "OPEN | MATCHED | SETTLED | DISPUTED",
  "winner_side": "YES | NO | A | B | null",
  "participants": [
    { "user": "string", "side": "YES|NO|A|B", "stake": 100 }
  ]
}
```

### Dispute

```json
{
  "id": "uuid",
  "bet_id": "uuid",
  "user_name": "string",
  "reason": "string",
  "status": "OPEN | RESOLVED",
  "created_at": "timestamptz"
}
```

### Notifications (local mode only)

```json
{
  "id": "string",
  "userId": "string",
  "text": "string",
  "createdAt": "number",
  "read": false
}
```

---

## Header & Navigation

* **Logo + “Bet Hub GH”** (clickable) → **Home**
* **Hamburger (mobile)** → slide-down menu with all nav links
* **Nav links:** Home, Create, Dashboard, Disputes, How it works, Terms
* **🔔 Notifications:** opens Dashboard Activity & marks read (local mode)
* **Connect / Switch / Logout**

  * **Connect** (no session) → Connect page
  * **Switch** (logged in) → Connect (create/switch profile)
  * **Logout** → clears session → Home

> If header doesn’t render: `js/app.js` dynamically imports `render.js`. Open DevTools Console for path/syntax errors.

---

## Pages & Buttons (Full Walkthrough)

### 1) **Home** (`index.html`)

**See**: Hero with quick actions; “Browse bets” + filter; bet cards
**Controls**:

* **Create Bet** → `create.html`
* **My Dashboard** → `dashboard.html`
* **Connect** (tip link) → `connect.html`
* **Filter** (Open only / All bets) → reload list
* **View** (card button) → `bet.html?id=<betId>`

**Happens**: Fetch bets (local/remote) → render via `betCard()`; periodic auto-refresh

---

### 2) **Create Bet** (`create.html`)

**Fields**:

* Type: **Yes/No** or **Head-to-Head (A vs B)**
* Outcome description (text)
* Stake (GHC)
* Expires in: 15m / 30m / 1h / 2h
* Resolver: **Auto** (random) or **Admin** (manual via Disputes)
* Your side: **YES/NO** or **A/B** (depends on type)

**Buttons**:

* **Create Bet** (validates, then creates)
* *(Badge)* 1% fee note (treasury demo)

**Happens**:

* **Local**: deduct stake from local balance; save bet to `localStorage`
* **Remote (Supabase)**: insert into `bets`; deduct local demo balance
* On success: link to the bet

**Errors**:

* “Please connect your wallet first”
* “Stake must be > 0”
* “Insufficient balance”
* Network errors (remote)

---

### 3) **Bet Detail** (`bet.html?id=...`)

**Info**: Type, stake, status, sides, players, countdown, winner side (after settle)

**Buttons (contextual)**:

* When **OPEN** (1 participant):

  * Join **YES/NO** (YES/NO bet)
  * Join **A/B** (H2H bet)
* When **MATCHED / DISPUTED**:

  * **Raise Dispute** (any user)
  * **Settle (Auto)** — random client-side winner; set **SETTLED**
* Otherwise:

  * “No actions available.”

**Happens**:

* **Join**: add second participant → **MATCHED**; deduct stake (demo)
* **Dispute**: status **DISPUTED**; admin can resolve
* **Settle (Auto)**: pick winner → **SETTLED**
* **Local**: compute pot − 1% fee → credit winners locally
* **Remote**: set `winner_side` (payouts remain local demo unless backend extended)

**Errors**:

* “Bet not open”
* “Already in this bet”
* “Connect wallet”
* Network errors

---

### 4) **Dashboard** (`dashboard.html`)

**Sections**:

* **Open / Matched / Settled / Disputed** — your bets grouped
* **Activity** — your notifications (local mode only)

**Happens**:

* Redirect to **Connect** if no user
* Load bets (awaits in remote mode), filter by `participants[].user`
* Auto-refresh every few seconds

> If empty: open Console; check Supabase errors or “Network error”.

---

### 5) **Connect** (`connect.html`)

**Fields/Buttons**:

* Username (text)
* Wallet Address (simulated) (text)
* **Generate** (random address)
* **Make this user Admin** (checkbox)
* **Create Profile** (creates local session with starting balance)
* **Cancel** (back to Home)

**Happens**:

* Stores `{ username, addr, isAdmin, balance }` as active session
* If already logged in, shows note to create/switch profile

---

### 6) **Disputes** (`disputes.html`)

**See**: Dispute list (bet id, reason, status)

**Admin-only buttons** (visible if `isAdmin: true`):

* **Resolve A / Resolve B / Resolve YES / Resolve NO**
  → sets `winner_side` and marks dispute **RESOLVED**

---

### 7) **How it Works** (`how-it-works.html`)

* Connect a profile → Create a bet → Join a bet → Settle (auto/admin) → Payout (local demo) → Dispute (optional)

### 8) **Terms** (`terms.html`)

* **Prototype/legal note**: demo only; no real funds; data may be stored locally on your device.

---

## Header — Mobile Behavior

* Hamburger toggles slide-down `.mobile-nav`
* Clicking any nav link or brand closes the menu
* Wallet badge truncates on small screens (avoid overflow)

---

## Bet Lifecycle

```
OPEN ──(second user joins)──► MATCHED
MATCHED ──(auto settle or admin resolve)──► SETTLED
MATCHED ──(raise dispute)──► DISPUTED ──(admin resolve)──► SETTLED
```

> Expiry countdown is informational. In **remote mode**, no automatic flip at expiry.

---

## Local vs Remote (How It Functions)

### Local mode (no backend)

* Data in `localStorage` under key `betHubGH_db_v1`
* Functions synchronous
* Notifications & treasury demo values exist
* Great for single-browser demos

### Remote mode (Supabase)

* Put **Project URL** + **anon key** in `js/supabaseClient.js`
* Create tables & RLS (see SQL below)
* Functions async; pages `await` them
* Everyone sees the same bets across browsers
* Demo balances still local unless you add a `users` table

**Where to get keys**
Supabase Dashboard → **Settings → API**

* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
  Add them in `js/supabaseClient.js`.

---

## Deployment & Caching Tips

* GitHub Pages can cache JS. Bump query strings in imports if needed:

  * In `app.js`: `import("./render.js?v=7")`
  * Or: `<script type="module" src="js/app.js?v=2"></script>`
* Project URL (GitHub Pages):

  * `https://<username>.github.io/BetHubGH/`

---

## Troubleshooting

* **Header not showing**

  * Ensure `css/style.css` has **no JavaScript** inside
  * `js/app.js` dynamically imports `render.js`; check Console for 404/syntax errors
  * Ensure each page includes `<header class="header"></header>` and `<footer class="footer"></footer>` (or rely on `app.js` auto-insert)
* **“undefined is not an object (…participants.map)”**

  * Treat async data as async. Use updated pages that `await` (`home.js`, `bet.js`, `dashboard.js`)
* **Supabase 400**

  * Wrong URL/key; missing `bets` table; or RLS not open
  * Verify in Console:

    ```js
    import("https://esm.sh/@supabase/supabase-js@2").then(({createClient})=>{
      const s = createClient("https://YOUR.supabase.co","ANON_KEY");
      return s.from("bets").select("*").limit(1);
    }).then(console.log).catch(console.error);
    ```
* **Dashboard empty**

  * Your `username` must appear in `participants[].user`
  * Create/join a bet with your connected username, or join from **Home**

---

## UX Notes (Buttons)

* **Connect** — create a local session (required before creating/joining bets)
* **Switch** — go to **Connect** to create another session/user
* **Logout** — clears the session → Home
* **Create Bet** — validates & creates; deducts stake (local demo)
* **Join YES/NO** / **Join A/B** — match an open bet; deducts stake (local demo)
* **Settle (Auto)** — random winner; sets **SETTLED**
* **Raise Dispute** — flags dispute; admins can resolve
* **Resolve A/B/YES/NO (Admin)** — finalizes disputed bet
* **Filter (Open/All)** on Home — toggles list view
* **View** (card) — open Bet Detail
* **Generate** (Connect) — random demo wallet address

---

## GitHub + Supabase Guide

This repo hosts a **static front-end** on GitHub Pages, with a shared, global database on **Supabase**. Everyone who opens your Pages URL sees the same bets (reads/writes go to Supabase).
Prototype only — balances/payouts are simulated client-side.

**What’s already done (high level)**

* **Responsive header** with hamburger; brand links to Home; wallet badge truncation
* Header/footer rendering is robust (auto-creates shell; dynamic imports)
* **Home / Bet / Dashboard** await async DB calls (Supabase-ready)
* **Dashboard** fixed (no duplicate id, activity slot, robust grouping)
* Supabase integration:

  * `js/supabaseClient.js` — Project URL + anon public key
  * `js/db.js` — remote DB API (async) for bets & disputes
  * SQL for tables + permissive demo RLS
* **Cache-busting** via `?v=...` query on module imports

---

## Quick Start

```bash
# Clone & serve locally
git clone https://github.com/<YOUR_USERNAME>/BetHubGH.git
cd BetHubGH
python3 -m http.server 3000
# open http://localhost:3000
```

**Set Supabase client keys**

```js
// js/supabaseClient.js
const SUPABASE_URL = "https://YOUR_SUBDOMAIN.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## Supabase SQL (Tables + RLS)

> Run in **Supabase → SQL Editor** (safe to re-run).

```sql
create extension if not exists pgcrypto;

create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text check (type in ('YESNO','H2H')) not null,
  outcome text not null,
  stake numeric not null,
  resolver text check (resolver in ('AUTO','ADMIN')) not null default 'AUTO',
  creator_username text not null,
  expires_at timestamptz not null,
  status text check (status in ('OPEN','MATCHED','SETTLED','DISPUTED')) not null default 'OPEN',
  winner_side text,
  participants jsonb not null
);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  bet_id uuid references bets(id) on delete cascade,
  user_name text not null,
  reason text not null,
  status text check (status in ('OPEN','RESOLVED')) not null default 'OPEN'
);

alter table bets enable row level security;
alter table disputes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bets') then
    create policy "public read bets" on bets for select using (true);
    create policy "public write bets" on bets for insert with check (true);
    create policy "public update bets" on bets for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='disputes') then
    create policy "public read disputes" on disputes for select using (true);
    create policy "public write disputes" on disputes for insert with check (true);
    create policy "public update disputes" on disputes for update using (true);
  end if;
end $$;
```

**Optional helpers**

```sql
-- Index to speed up "open bets"
create index if not exists idx_bets_status_created on bets (status, created_at desc);

-- Reset demo data
truncate table disputes restart identity cascade;
truncate table bets restart identity cascade;

-- Seed a test bet
insert into bets (type, outcome, stake, resolver, creator_username, expires_at, status, participants)
values (
  'YESNO','Black Stars win next match', 50, 'AUTO', 'demo',
  now() + interval '1 hour', 'OPEN',
  '[{"user":"demo","side":"YES","stake":50}]'::jsonb
);
```

---

## Publish on GitHub Pages

* Repo → **Settings → Pages**
* Source: **Deploy from branch** → Branch: `main` → Folder: `/ (root)`
* Open: `https://<YOUR_USERNAME>.github.io/BetHubGH/`

---

## How the Front-End Works

* **`js/app.js`** — Ensures `<header>`/`<footer>` shells; dynamically imports `render.js`; optionally calls `initDB()`. Dynamic imports prevent hard crashes; errors surface in Console.
* **`js/render.js`** — Renders header (brand → Home), mobile menu, 🔔, user controls, footer; exports `betCard()`.
* **`js/db.js` (Supabase version)** — All functions **async**; CRUD for bets/disputes; session helpers. “Balance” remains demo-local unless you add a users table.
* **`js/pages/*.js`**

  * `home.js` — lists open/all bets; auto-refresh
  * `create.js` — validates & creates bet
  * `bet.js` — loads bet; join, dispute, settle (auto)
  * `dashboard.js` — your bets grouped; activity (local only)

---

## Per-Page Summary

* **Home** — Filter (Open/All); bet cards with **View**
* **Create** — Submit to Supabase (remote) or local; stake deducted locally (demo)
* **Bet Detail** — Join YES/NO or A/B; **Raise Dispute**; **Settle (Auto)**
* **Dashboard** — Grouped: Open, Matched, Settled, Disputed; auto-refresh
* **Connect** — Create/switch a local session (username, optional admin)
* **Disputes** — Admin resolve YES/NO or A/B → sets winner and closes dispute
* **Header** — Brand → Home; **Switch** (to Connect); **Logout**; **🔔** marks local notifications read; hamburger toggles mobile menu

---

## Updating the Repo (Code)

```bash
git add .
git commit -m "feat: <what you changed>"
git push origin main
```

**Cache-busting**

* In `app.js`:

  ```js
  const { renderHeader, renderFooter } = await import("./render.js?v=7");
  ```
* Or in HTML:

  ```html
  <script type="module" src="js/app.js?v=2"></script>
  ```

---

## Updating the Database

**Change schema** (add columns, indexes): use Supabase SQL Editor.

**Tighten policies** (production later): replace permissive `true` with auth-aware rules.

**Reset demo data**: see SQL helpers above.

---

## Smoke Tests

Open site → DevTools Console:

```js
import("https://esm.sh/@supabase/supabase-js@2").then(({createClient})=>{
  const s = createClient("https://YOUR_SUBDOMAIN.supabase.co","YOUR_ANON_PUBLIC_KEY");
  return s.from("bets").select("*").limit(1);
}).then(console.log).catch(console.error);
```

If this errors → wrong URL/key, missing table, or RLS denies.

---

## Common Errors & Fixes

* **Header not showing** — check `render.js` path/syntax; ensure CSS has no JS; header/footer shells present.
* **TypeError: …participants.map** — await async data in pages.
* **Supabase 400** — double-check `SUPABASE_URL` & `ANON_KEY`; confirm tables/RLS exist.
* **Dashboard empty** — your `username` must be in `participants[].user`.

---

## Changelog

**UI/UX**

* Mobile header/hamburger; brand → Home; wallet badge truncation.

**Structure**

* `app.js` ensures header/footer shells; dynamic imports (cache-friendly).
* `render.js` houses header/footer + `betCard`.

**Pages**

* `home.js`, `bet.js`, `dashboard.js` now `await` DB calls.
* `dashboard.html` Activity section id fixed; added `#activity-list`.

**Data**

* `js/db.js` switched to Supabase (async) API.
* `js/supabaseClient.js` introduced (URL + anon key).
* SQL for tables, RLS, seed/reset helpers.

---

## Updating GitHub Pages + DB Together

1. Apply SQL in Supabase first (tables/columns/policies).
2. Update code & push:

   ```bash
   git add .
   git commit -m "feat(db): use <new column/behavior>; update UI"
   git push origin main
   ```
3. Hard-refresh Pages (or bump `?v=` in imports).

---

**License**
Prototype for demonstration purposes. Add your preferred license.
