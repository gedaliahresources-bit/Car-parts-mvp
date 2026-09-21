import Link from "next/link";
import { searchListings } from "@/lib/search";
import { initSchema } from "@/lib/db";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await Promise.resolve(searchParams);
  const partName = one(sp.partName);
  const partNumber = one(sp.partNumber);
  const year = one(sp.year);
  const make = one(sp.make);
  const model = one(sp.model);

  const hasQuery =
    partName.trim() !== "" ||
    partNumber.trim() !== "" ||
    year.trim() !== "" ||
    make.trim() !== "" ||
    model.trim() !== "";

  let results: Awaited<ReturnType<typeof searchListings>> = [];
  let dbError: string | null = null;

  if (hasQuery) {
    try {
      await initSchema();
      results = await searchListings({
        partName,
        partNumber,
        year,
        make,
        model,
      });
    } catch (e) {
      dbError =
        e instanceof Error
          ? e.message
          : "Database error — run npm run demo:seed first.";
    }
  }

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Car Parts Match</h1>
          <p className={styles.sub}>
            Search seller inventory by part name, part number, and/or year /
            make / model.
          </p>
        </header>

        <form className={styles.form} method="get" action="/">
          <label>
            Part name
            <input
              name="partName"
              defaultValue={partName}
              placeholder="e.g. alternator"
            />
          </label>
          <label>
            Part number
            <input
              name="partNumber"
              defaultValue={partNumber}
              placeholder="OEM or aftermarket #"
            />
          </label>
          <label>
            Year
            <input
              name="year"
              defaultValue={year}
              placeholder="2015"
              inputMode="numeric"
            />
          </label>
          <label>
            Make
            <input name="make" defaultValue={make} placeholder="Honda" />
          </label>
          <label>
            Model
            <input name="model" defaultValue={model} placeholder="Civic" />
          </label>
          <div className={styles.actions}>
            <button type="submit">Search</button>
            <a className={styles.clear} href="/">
              Clear
            </a>
          </div>
        </form>

        {dbError && <p className={styles.error}>{dbError}</p>}

        {!hasQuery && !dbError && (
          <p className={styles.hint}>Enter at least one field to search.</p>
        )}

        {hasQuery && !dbError && results.length === 0 && (
          <div role="status">
            <p className={styles.empty}>No matches for this search.</p>
            <p className={styles.hint}>
              Try fewer filters (part name only) or another year/make/model. Seed
              covers common parts across several vehicles.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <section className={styles.results} aria-live="polite">
            <h2>
              {results.length} match{results.length === 1 ? "" : "es"}
            </h2>
            <ul className={styles.list}>
              {results.map((r) => (
                <li key={r.id} className={styles.card}>
                  <div className={styles.cardTitle}>
                    <strong>
                      <Link href={`/listings/${r.id}`}>{r.part_name}</Link>
                    </strong>
                    {r.price_text && (
                      <span className={styles.price}>{r.price_text}</span>
                    )}
                  </div>
                  <dl className={styles.meta}>
                    <div>
                      <dt>Part #</dt>
                      <dd>{r.part_number ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Condition</dt>
                      <dd>{r.condition}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{r.location}</dd>
                    </div>
                    <div>
                      <dt>Seller</dt>
                      <dd>{r.seller_name}</dd>
                    </div>
                    <div className={styles.fitment}>
                      <dt>Fitment</dt>
                      <dd>{r.fitment_summary}</dd>
                    </div>
                  </dl>
                  {r.notes && <p className={styles.notes}>{r.notes}</p>}
                  <p className={styles.notes}>
                    <Link href={`/listings/${r.id}`}>Open match →</Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
