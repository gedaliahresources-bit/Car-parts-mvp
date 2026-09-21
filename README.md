# Openlot — MVP (Slices 0–4 + home-services 0–3)

Local marketplace loop: sellers list parts → buyers search → match via in-app thread and/or contact handoff. Home-services: pros list profiles → homeowners search → lead / message. No payments.

## Stack

- Next.js 14 (App Router) + TypeScript
- SQLite via `@libsql/client` (`data/car-parts.db`)
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
| `npm run demo:seed` | Reset DB — sellers, listings, home-service pros + demo pro user |
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
