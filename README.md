# Openlot — MVP (Slices 0–4)

Local marketplace loop: sellers list parts → buyers search → match via in-app thread and/or contact handoff. No payments.

## Stack

- Next.js 14 (App Router) + TypeScript
- SQLite via `@libsql/client` (`data/car-parts.db`)
- Server actions for auth, seller CRUD, messaging
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
| `/services` | Home-services pro search (trade + location + license filters) |
| `/listings/[id]` | Listing detail — public read; message requires login |
| `/threads/[id]` | In-app messaging (participants only) |
| `/login` | Sign in (email + password) |
| `/signup` | Sign up as buyer or seller |
| `/seller` | Redirects to your inventory (or login) — no open picker |
| `/seller/[sellerId]` | Own inventory only (edit / deactivate) |
| `/seller/[sellerId]/new` | Create listing (own account only) |
| `/seller/[sellerId]/listings/[id]/edit` | Edit listing (own account only) |

## Demo accounts (after seed)

All seeded users share password: **`demo1234`**

| Email | Role | Name |
|-------|------|------|
| `yard@peachtree-salvage.example` | seller | Peachtree Auto Salvage |
| `sales@metrousedparts.example` | seller | Metro Used Parts Co |
| `parts@southern-yard.example` | seller | Southern Yard Supply |
| `buyer@example.com` | buyer | Demo Buyer |

## Demo the full loop

1. **Seed:** `npm run demo:seed`
2. **Seller login:** `/login` → `yard@peachtree-salvage.example` + `demo1234` → My inventory → **+ New listing**
3. **Search (public):** `/` → search `alternator` or YMM `2015` / `Honda` / `Civic`
4. **Buyer message:** log out → `/login` as `buyer@example.com` → open a listing → **Message seller**
5. **Ownership:** logged-out `/seller` redirects to login; another seller’s `/seller/[id]` redirects to your own inventory
6. **Deactivate:** from your inventory → Deactivate → listing disappears from search

## Prove without a browser

```bash
npm run demo:seed
npm run demo:verify
npm run demo:verify-services
```

`demo:verify` covers search (A2/A3/A6), create/edit (A1), deactivate (A7), thread/contact (A5), and auth (Peachtree login, hashed passwords, signup seller listing in search, ownership checks).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run demo:seed` | Reset DB — sellers, listings, and ~11 active home-service pros |
| `npm run demo:verify` | Car-parts acceptance checks |
| `npm run demo:verify-services` | Home-services H1–H4, H6 checks |
| `npm run dev` | Dev server (default port 3000) |

## Home services (Slice 0–1)

```bash
npm run demo:seed
npm run demo:verify-services
npm run dev
```

Open `/services?trade=plumbing&location=Atlanta` — **Atlanta Plumbing Co** appears labeled **unverified**. Toggle **Licensed only** to see verified pros with source link (never bare “licensed”).

## Required seed row

- part: **alternator**
- fitment: **2015 Honda Civic**
- condition: **used**
- location: **Atlanta, GA**
- seller: Peachtree Auto Salvage
