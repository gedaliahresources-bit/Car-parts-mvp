# Car Parts Match — MVP (Slices 0–3)

Local marketplace loop: sellers list parts → buyers search → match via in-app thread and/or contact handoff. No payments.

## Stack

- Next.js 14 (App Router) + TypeScript
- SQLite via `@libsql/client` (`data/car-parts.db`)
- Server actions for seller CRUD + messaging

## Setup

```bash
cd /workspace/car-parts-mvp
npm install
npm run demo:seed
npm run dev
```

Open http://localhost:3000

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Buyer search (part name / # / YMM) |
| `/listings/[id]` | Listing detail — contact handoff + Message seller |
| `/threads/[id]` | In-app messaging thread |
| `/seller` | Pick a seeded seller (auth stub) |
| `/seller/[sellerId]` | That seller’s inventory (edit / deactivate) |
| `/seller/[sellerId]/new` | Create listing |
| `/seller/[sellerId]/listings/[id]/edit` | Edit listing |

## Demo the full loop

1. **Seed:** `npm run demo:seed`
2. **List (seller):** open `/seller` → Peachtree Auto Salvage → **+ New listing** (or edit an existing one).
3. **Search (buyer):** `/` → search `alternator` or YMM `2015` / `Honda` / `Civic`.
4. **Handoff:** click a result → **Open match** → see contact (if seller provided it) → **Message seller** → thread opens.
5. **Deactivate:** from seller inventory, Deactivate → that listing disappears from search.

## Prove without a browser

```bash
npm run demo:seed
npm run demo:verify
```

Covers search (A2/A3/A6), create/edit (A1), deactivate (A7), and thread/contact (A5).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run demo:seed` | Reset DB — ~3 sellers + ~29 listings |
| `npm run demo:verify` | Acceptance checks against the DB |
| `npm run dev` | Dev server (default port 3000) |

## Required seed row

- part: **alternator**
- fitment: **2015 Honda Civic**
- condition: **used**
- location: **Atlanta, GA**
- seller: Peachtree Auto Salvage
