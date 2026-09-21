# Car-parts marketplace MVP — PRD

**Brand:** Openlot (Openlot LLC)
**Product:** online junkyard / car-parts match
**Owner:** Immanuel (lotforge)
**Status:** draft for first build
**Out of sequence:** home-services stays parked until this match loop is proven on sample data

## Goal

Prove one loop: a buyer looking for a part can find seller(s) who list it, then open a contact handoff. No checkout. No payments.

## Users

- **Buyer** — needs a specific part for a vehicle
- **Seller** — yard or private seller with inventory to list

## Success (demoable)

On real sample data (not faked ratings):

1. Seller creates a listing (part identity + condition + location)
2. Buyer searches by part name, part number, and/or year / make / model
3. Results show matching seller listings
4. Buyer opens a match → messaging thread or clear contact handoff to that seller

If those four steps fail on seeded data, the slice is not done.

## Functional requirements

### Listings (seller)

- Create / edit / deactivate a listing
- Fields: part name, optional part number (OEM or aftermarket), optional vehicle fitment (year, make, model — one or many), condition (`new` | `used` | `refurbished` | `core`), location (city + state or zip), optional notes, optional price display as text only (no charge)
- Listing is real inventory the seller entered — no auto-generated fake stock

### Search (buyer)

- Query by: free-text part name, part number, and/or year + make + model
- Return ranked listing matches with seller identity, condition, location, and enough part detail to decide
- Empty state is honest ("no matches") — never pad with fake inventory

### Match / handoff

- From a result, buyer can open a thread to the listing’s seller **or** see a contact handoff the seller opted into (email or phone shown only if seller provided it for that purpose)
- No black-box checkout
- No bulk email/SMS to sellers or buyers

### Trust (minimal)

- Show seller display name and listing location
- No reviews or star ratings in MVP (avoids fake social proof)

## Non-goals (hard out)

- Live payments, cards, escrow, payouts
- Cart / checkout / order lifecycle
- Email or SMS blast / marketing to users
- Scraping closed sources for contacts or inventory
- Fake inventory, reviews, or ratings
- Home-services product (separate module; starts only after this loop is proven)
- Mobile-native apps (web MVP first)

## Assumptions

- Sample data is hand-seeded (a few sellers, ~20–50 listings across common parts)
- Auth can be light for demo (local accounts or seeded users); production auth later
- Shared marketplace bones (auth, listings, search, messaging) stay in one stack; car-parts domain rules stay in a parts module

## Failure modes to show

- No match for a valid search
- Ambiguous part name (multiple listings; buyer must pick)
- Seller deactivated listing → not returned in search
- Seller left no contact method → handoff blocked with clear copy

## Acceptance tests

| # | Test | Pass if |
|---|------|--------|
| A1 | Seed seller lists "alternator" for 2015 Honda Civic, used, Atlanta GA | Listing persists and shows in seller inventory |
| A2 | Buyer searches part name `alternator` | Seeded listing appears |
| A3 | Buyer searches YMM `2015` / `Honda` / `Civic` | Same listing appears |
| A4 | Buyer searches part number that only one listing has | Only that listing |
| A5 | Buyer opens match | Thread or contact handoff to that seller loads |
| A6 | Search with no inventory | Honest empty state |
| A7 | Deactivate listing | Disappears from search |

## Recommended stack (no preference yet)

**Next.js (App Router) + SQLite (better-sqlite3 or libsql) + plain server actions**

Why: one local process, real DB, fast demo, easy to grow into shared marketplace bones later. Not mobile-first; web MVP.

Fallback if you want even smaller: plain HTML forms + SQLite + a tiny Node/Express API.

## MVP scope

### In

- Seeded sellers + listings
- Seller list CRUD (minimal UI)
- Buyer search (name / number / YMM)
- Match → messaging or contact handoff
- Local demo script that runs A1–A7

### Out

- Payments, shipping, disputes
- Reviews, badges, verified-license claims
- Push/email notifications beyond in-app thread
- Multi-photo galleries, map search, advanced filters
- Home-services anything

## Smallest build plan

1. **Slice 0 — data + seed** — schema for users, listings, threads/messages; seed 2–3 sellers and ~30 parts
2. **Slice 1 — search** — buyer search page + match results (prove A2–A4, A6)
3. **Slice 2 — list** — seller create/edit/deactivate (prove A1, A7)
4. **Slice 3 — handoff** — open thread or show contact (prove A5)
5. **Verify** — run A1–A7 end-to-end on sample data; only then call MVP match loop done

## First build slice (do next)

**Slice 0 + Slice 1:** schema, seed data, buyer search returning real matches.

Done when: from a cold start, `npm run demo:seed` (or equivalent) loads sample inventory and searching `alternator` + `2015 Honda Civic` returns the seeded seller listing with no fake fillers.

---

*Written by lotforge. Home-services PRD intentionally not started.*
