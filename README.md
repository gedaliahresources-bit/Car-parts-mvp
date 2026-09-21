# Openlot — MVP (Slices 0–4 + home-services 0–3)

Local marketplace loop: sellers list parts → buyers search → match via in-app thread and/or contact handoff. Home-services: pros list profiles → homeowners search → lead / message. No payments.

## Stack

- Next.js 14 (App Router) + TypeScript
- SQLite via `@libsql/client` — local file (`data/car-parts.db`) or remote **Turso** (`libsql://` / `https://`)
- Server actions for auth, seller CRUD, messaging, pro CRUD, service leads
- Passwords: Node `scrypt` (never plaintext)
- Sessions: signed JWT in an **HttpOnly** cookie (`jose`)

## Setup

```bash
cd /workspace/car-parts-mvp
npm install
npm run demo:seed
npm run dev
```

Open http://localhost:3000

Optional: set `SESSION_SECRET` for production cookie signing (a dev default is used if unset).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Buyer search (part name / # / YMM) — public |
| `/listings/[id]` | Listing detail — public read; message requires login |
| `/threads/[id]` | Car-parts in-app messaging (participants only) |
| `/login` | Sign in (email + password) |
| `/signup` | Sign up as buyer or seller |
| `/seller` | Redirects to your inventory (or login) — no open picker |
| `/seller/[sellerId]` | Own inventory only (edit / deactivate) |
| `/seller/[sellerId]/new` | Create listing (own account only) |
| `/seller/[sellerId]/listings/[id]/edit` | Edit listing (own account only) |
| `/services` | Home-services pro search (trade + location + license filters) |
| `/services/pros/[id]` | Pro detail + lead / message handoff |
| `/services/threads/[id]` | Service messaging thread |
| `/services/pro` | Gate → your pro dashboard (login required) |
| `/services/pro/[userId]` | Own pro profiles only |
| `/services/pro/[userId]/new` | Create pro profile |
| `/services/pro/[userId]/[proId]/edit` | Edit own pro profile |
| `/atlanta` | Public Atlanta pilot landing (parts + home services) |
| `/admin/supply` | Password-gated one-row supply import (`ADMIN_SUPPLY_KEY`) |


## Atlanta supply onboarding (real yards / pros)

Recruitment contact lists stay **off-site** (spreadsheet / email). Do **not** auto-import them into production inventory.

After a yard or pro says yes (verbal or email):

1. **Self-serve (preferred):** send them `/atlanta` → Sign up as seller (`/signup?role=seller`) or Pro (`/services/pro`), then they add their own listings/profiles.
2. **Admin assist:** open `/admin/supply`, unlock with `ADMIN_SUPPLY_KEY`, paste **one** CSV row to create a seller (+ optional listing stub) or a pro profile (`license_status=unverified`, notes `source: atlanta-recruitment`). Temp password is shown once.

CSV shapes:

```
seller,email,display_name,phone[,part_name,location]
pro,email,display_name,phone,business_name,trades,service_area
```

Set the key on Fly when ready (never commit it):

```bash
fly secrets set ADMIN_SUPPLY_KEY="$(openssl rand -hex 24)" --app openlot
```

Also set `SESSION_SECRET` as documented below. Recruitment CSVs are not deployed with the app.

## Demo accounts (after seed)

All seeded users share password: **`demo1234`**

| Email | Role | Name |
|-------|------|------|
| `yard@peachtree-salvage.example` | seller | Peachtree Auto Salvage |
| `sales@metrousedparts.example` | seller | Metro Used Parts Co |
| `parts@southern-yard.example` | seller | Southern Yard Supply |
| `buyer@example.com` | buyer | Demo Buyer (homeowner leads) |
| `pro@atlanta-plumbing.example` | seller | Atlanta Plumbing Co (owns that pro profile) |

## Demo the full loop (car-parts)

1. **Seed:** `npm run demo:seed`
2. **Seller login:** `/login` → `yard@peachtree-salvage.example` + `demo1234` → My inventory → **+ New listing**
3. **Search (public):** `/` → search `alternator` or YMM `2015` / `Honda` / `Civic`
4. **Buyer message:** log out → `/login` as `buyer@example.com` → open a listing → **Message seller**
5. **Ownership:** logged-out `/seller` redirects to login; another seller’s `/seller/[id]` redirects to your own inventory
6. **Deactivate:** from your inventory → Deactivate → listing disappears from search

## Demo the full loop (home services)

1. **Seed:** `npm run demo:seed`
2. **Search:** `/services?trade=plumbing&location=Atlanta` — **Atlanta Plumbing Co** appears labeled **unverified**
3. **Licensed filter:** toggle **Licensed only** — unverified excluded; verified pros show source link
4. **Pro login:** `/login` → `pro@atlanta-plumbing.example` + `demo1234` → **My pro profiles** → edit / deactivate
5. **Homeowner lead:** log out → `/login` as `buyer@example.com` → open Atlanta Plumbing Co → **Send lead** → land on `/services/threads/[id]`
6. **Deactivate:** as pro → Deactivate → pro disappears from search

## Prove without a browser

```bash
npm run demo:seed
npm run demo:verify
npm run demo:verify-services
```

`demo:verify` covers car-parts search, CRUD, thread/contact, and auth.

`demo:verify-services` covers H1–H7 (seed, search, licensed filter, verified source, lead/thread, empty state, deactivate).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run demo:seed` | Local: wipe file DB + seed. Turso: soft-seed if empty (no wipe unless `SEED_RESET=1`) |
| `npm run demo:verify` | Car-parts acceptance checks |
| `npm run demo:verify-services` | Home-services H1–H7 |
| `npm run dev` | Dev server (default port 3000) |

## Required seed row (car-parts)

- part: **alternator**
- fitment: **2015 Honda Civic**
- condition: **used**
- location: **Atlanta, GA**
- seller: Peachtree Auto Salvage

## Required seed row (home services)

- business: **Atlanta Plumbing Co**
- trade: **plumbing**
- area: **Atlanta, GA**
- license: **unverified**
- owner: `pro@atlanta-plumbing.example` / `demo1234`

## Deploy on Vercel + Turso (recommended)

GitHub repo: [`gedaliahresources-bit/Car-parts-mvp`](https://github.com/gedaliahresources-bit/Car-parts-mvp)

Vercel has no persistent disk and no long-running `start:prod`. Use Next.js defaults + a remote Turso (libsql) database.

1. **Create a Turso database** ([turso.tech](https://turso.tech) / CLI). Copy the database URL (`libsql://…` or `https://…`) and an auth token.
2. **Import the GitHub repo** in [Vercel](https://vercel.com) → Add New → Project → `gedaliahresources-bit/Car-parts-mvp`.
3. **Environment variables** (Production + Preview as needed):
   - `TURSO_DATABASE_URL` — Turso URL
   - `TURSO_AUTH_TOKEN` — Turso auth token
   - `SESSION_SECRET` — long random string for cookie signing
4. **Build settings:** Framework Preset **Next.js**. Build Command `next build` (default). Output: Next.js defaults — do **not** set a custom start command.
5. **Seed after first deploy** (pick one):
   - **Automatic (preferred):** On first request, `initSchema()` creates tables and soft-seeds if `users` is empty. Result is cached in-memory per serverless isolate so later requests are not blocked by a seed check.
   - **Manual soft seed from your machine:**
     ```bash
     export TURSO_DATABASE_URL=libsql://…
     export TURSO_AUTH_TOKEN=…
     npm run demo:seed
     ```
     Against Turso, `demo:seed` **does not delete** the remote DB. If users already exist it is a no-op. To wipe and re-seed remotely: `SEED_RESET=1 npm run demo:seed`.
   - Optional: `vercel env pull` then run the same commands locally.

Aliases also accepted: `DATABASE_URL` / `DATABASE_AUTH_TOKEN` instead of the `TURSO_*` names.

Local default is unchanged: file SQLite under `./data` unless `DATA_DIR` or `DATABASE_PATH` is set. No Turso env → local file mode.

## Deploy on Render (alternate / paid disk)

`render.yaml` remains for a **Node web service + persistent disk** (local file SQLite). This path needs a **paid** Render plan for disks; prefer **Vercel + Turso** for free/serverless.

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect the GitHub repo (uses `render.yaml`).
2. Or create a **Web Service** manually:
   - **Runtime:** Node
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start:prod` (runs `ensure-seed` then `next start`)
   - **Env:** `NODE_VERSION=20`, `SESSION_SECRET` (generate), `DATA_DIR=/var/data`
   - **Disk:** name `openlot-data`, mount `/var/data`, size 1 GB
   - **Health check path:** `/`
3. Free web services may sleep; **persistent disks require Starter+**. Without a disk, SQLite under `/var/data` will not survive deploys/restarts.

## Deploy on Fly.io (persistent SQLite volume)

Runs the Docker image with a Fly volume mounted at `/data` (`DATA_DIR=/data`). Local, Turso/Vercel, and Render paths stay unchanged.

### One-time setup

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login

# Create the app (use openlot-app if "openlot" is taken)
fly apps create openlot
# or: fly apps create openlot-app
# If you used openlot-app, set app = "openlot-app" in fly.toml

# Persistent SQLite volume (1 GB) in primary region iad
fly volumes create openlot_data --size 1 --region iad --app openlot

# Cookie signing secret (generate your own; never commit it)
fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" --app openlot
```

### Deploy

```bash
fly deploy --app openlot
```

Or from a fresh clone: `fly launch` (accept/adjust the existing `fly.toml`; do not overwrite the volume mount).

### Notes

- **Volume:** `[[mounts]]` source `openlot_data` → `/data`. SQLite file lives at `/data/car-parts.db`.
- **Seed:** container entrypoint runs `ensure-seed` softly (failure does not block boot), then `node server.js` (standalone).
- **Free allowance:** Fly free/trial allowances change; expect limited shared-CPU VMs, sleep on idle (`auto_stop_machines`), and volume size quotas. A 1 GB volume and one `iad` machine is the intended small footprint. Check [Fly pricing](https://fly.io/docs/about/pricing/) for current free allowances.
- **Secrets only via CLI/dashboard:** `SESSION_SECRET`, and when using admin import `ADMIN_SUPPLY_KEY` — never put a real secret in `fly.toml` or the repo.
- Prefer **Vercel + Turso** if you want serverless with no disk; use Fly when you want file SQLite on a volume.
