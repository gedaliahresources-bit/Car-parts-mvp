import Link from "next/link";
import { searchPros } from "@/lib/services/search";
import { TRADE_OPTIONS, type ServicePro } from "@/lib/services/pros";
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

function LicenseBadge({ pro }: { pro: ServicePro }) {
  if (pro.license_status === "verified") {
    const sourceName =
      pro.license_source_name ?? "verification source";
    return (
      <div className={styles.licenseBlock}>
        <span className={`${styles.badge} ${styles.badgeVerified}`}>
          verified
        </span>
        <span className={styles.licenseDetail}>
          {pro.license_number ? (
            <>License #{pro.license_number} · </>
          ) : null}
          {pro.license_source_url ? (
            <a
              href={pro.license_source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceName}
            </a>
          ) : (
            sourceName
          )}
          {pro.license_checked_on
            ? ` · checked ${pro.license_checked_on}`
            : null}
        </span>
      </div>
    );
  }

  if (pro.license_status === "not_applicable") {
    return (
      <div className={styles.licenseBlock}>
        <span className={`${styles.badge} ${styles.badgeNa}`}>
          not applicable
        </span>
        <span className={styles.licenseDetail}>
          No license claim is made for this listing (self-declared).
        </span>
      </div>
    );
  }

  return (
    <div className={styles.licenseBlock}>
      <span className={`${styles.badge} ${styles.badgeUnverified}`}>
        unverified
      </span>
      <span className={styles.licenseDetail}>
        License not verified — do not treat as licensed.
      </span>
    </div>
  );
}

export default async function ServicesSearchPage({ searchParams }: Props) {
  const sp = await Promise.resolve(searchParams);
  const trade = one(sp.trade);
  const location = one(sp.location);
  const licensedOnly = one(sp.licensedOnly) === "1";
  const experiencedOnly = one(sp.experiencedOnly) === "1";

  const hasQuery =
    trade.trim() !== "" ||
    location.trim() !== "" ||
    licensedOnly ||
    experiencedOnly;

  let results: ServicePro[] = [];
  let dbError: string | null = null;

  if (hasQuery) {
    try {
      await initSchema();
      results = await searchPros({
        trade,
        location,
        licensedOnly,
        experiencedOnly,
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
          <h1>Openlot — Home services</h1>
          <p className={styles.sub}>
            Find local pros by trade and area. License claims are labeled
            honestly: verified (with source), unverified, or not applicable.
          </p>
          <p className={styles.sub} style={{ marginTop: "0.5rem" }}>
            <Link href="/services/pro">Manage my pro profiles</Link>
          </p>
        </header>

        <form className={styles.form} method="get" action="/services">
          <label>
            Trade
            <input
              name="trade"
              list="trade-options"
              defaultValue={trade}
              placeholder="e.g. plumbing"
            />
            <datalist id="trade-options">
              {TRADE_OPTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label>
            Location
            <input
              name="location"
              defaultValue={location}
              placeholder="city, state, or zip"
            />
          </label>
          <fieldset className={styles.filters}>
            <legend>Filters</legend>
            <label className={styles.check}>
              <input
                type="checkbox"
                name="licensedOnly"
                value="1"
                defaultChecked={licensedOnly}
              />
              Licensed only (verified)
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                name="experiencedOnly"
                value="1"
                defaultChecked={experiencedOnly}
              />
              Experienced only (5+ years)
            </label>
          </fieldset>
          <div className={styles.actions}>
            <button type="submit">Search</button>
            <a className={styles.clear} href="/services">
              Clear
            </a>
          </div>
        </form>

        {dbError && <p className={styles.error}>{dbError}</p>}

        {!hasQuery && !dbError && (
          <p className={styles.hint}>
            Enter a trade and/or location to search. Filters are optional.
          </p>
        )}

        {hasQuery && !dbError && results.length === 0 && (
          <div role="status">
            <p className={styles.empty}>No pros match this search.</p>
            <p className={styles.hint}>
              Try a broader trade or city, or clear the licensed / experienced
              filters. We never pad results with fake pros.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <section className={styles.results} aria-live="polite">
            <h2>
              {results.length} match{results.length === 1 ? "" : "es"}
            </h2>
            <ul className={styles.list}>
              {results.map((pro) => (
                <li key={pro.id} className={styles.card}>
                  <div className={styles.cardTitle}>
                    <strong>
                      <Link href={`/services/pros/${pro.id}`}>
                        {pro.business_name}
                      </Link>
                    </strong>
                    <span className={styles.years}>
                      {pro.years_experience} yr
                      {pro.years_experience === 1 ? "" : "s"}
                    </span>
                  </div>
                  <LicenseBadge pro={pro} />
                  <dl className={styles.meta}>
                    <div>
                      <dt>Trade</dt>
                      <dd>{pro.trade_list.join(", ")}</dd>
                    </div>
                    <div>
                      <dt>Service area</dt>
                      <dd>{pro.service_area}</dd>
                    </div>
                    {pro.specialties && (
                      <div className={styles.full}>
                        <dt>Specialties</dt>
                        <dd>{pro.specialties}</dd>
                      </div>
                    )}
                  </dl>
                  {pro.notes && <p className={styles.notes}>{pro.notes}</p>}
                  <p className={styles.selfDecl}>
                    Experience and area are self-declared unless separately
                    verified.
                  </p>
                  <p style={{ marginTop: "0.65rem", fontSize: "0.9rem" }}>
                    <Link href={`/services/pros/${pro.id}`}>
                      View profile / send lead →
                    </Link>
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
