import Link from "next/link";
import {
  adminSupplyImportAction,
  adminSupplyUnlockAction,
} from "./actions";
import { consumeSupplyFlash } from "@/lib/admin-supply-flash";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";
import formStyles from "@/app/components/ListingForm.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function keyConfigured(): boolean {
  return Boolean(process.env.ADMIN_SUPPLY_KEY);
}

export default async function AdminSupplyPage({ searchParams }: Props) {
  const key = one(searchParams.key);
  const expected = process.env.ADMIN_SUPPLY_KEY;
  const unlocked = Boolean(expected && key && key === expected);
  const result = unlocked ? await consumeSupplyFlash() : null;

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Admin · Atlanta supply import</h1>
          <p className={styles.sub}>
            Password-gated helper for onboarding a yard or pro after they say
            yes. Does <strong>not</strong> bulk-import recruitment lists into
            live inventory.
          </p>
        </header>

        {!keyConfigured() && (
          <p className={styles.blocked} role="alert" style={{ marginTop: "1rem" }}>
            ADMIN_SUPPLY_KEY is not set. Set it as a Fly secret (or env) before
            using this page.
          </p>
        )}

        {!unlocked ? (
          <form
            action={adminSupplyUnlockAction}
            className={formStyles.form}
            style={{ marginTop: "1rem" }}
          >
            <label>
              Admin key *
              <input
                name="key"
                type="password"
                required
                autoComplete="off"
                placeholder="ADMIN_SUPPLY_KEY"
                defaultValue={key}
              />
            </label>
            <button type="submit">Unlock</button>
          </form>
        ) : (
          <>
            {result && (
              <div
                className={result.ok ? styles.flash : styles.blocked}
                role="status"
                style={{ marginTop: "1rem" }}
              >
                {result.ok ? (
                  <>
                    <p>
                      Created <strong>{result.kind}</strong> for{" "}
                      <code>{result.email}</code> (user #{result.userId}
                      {result.listingId != null
                        ? ` · listing #${result.listingId}`
                        : ""}
                      {result.proId != null ? ` · pro #${result.proId}` : ""}
                      {result.existingUser ? " · existing user" : ""})
                    </p>
                    {result.tempPassword ? (
                      <p style={{ marginTop: "0.5rem" }}>
                        Temp password (shown once):{" "}
                        <code>{result.tempPassword}</code>
                        <br />
                        <span className={styles.sub}>
                          Share securely; they should change it after first
                          login.
                        </span>
                      </p>
                    ) : result.existingUser ? (
                      <p className={styles.sub} style={{ marginTop: "0.5rem" }}>
                        Attached to existing account — no new password.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p>{result.error}</p>
                )}
              </div>
            )}

            <form
              action={adminSupplyImportAction}
              className={formStyles.form}
              style={{ marginTop: "1rem" }}
            >
              <input type="hidden" name="key" value={key} />
              <label>
                One CSV row (first data row only)
                <textarea
                  name="csv"
                  rows={4}
                  required
                  placeholder={`seller,yard@example.com,Peachtree Salvage,404-555-0100,Alternator,Atlanta, GA\npro,pro@example.com,Atlanta Plumbing Co,404-555-0200,Atlanta Plumbing Co,plumbing,Atlanta, GA`}
                />
              </label>
              <p className={styles.sub}>
                Formats:
                <br />
                <code>
                  seller,email,display_name,phone[,part_name,location]
                </code>
                <br />
                <code>
                  pro,email,display_name,phone,business_name,trades,service_area
                </code>
                <br />
                New pros default to <code>license_status=unverified</code>. Notes
                get <code>source: atlanta-recruitment</code>. Optional seller
                part_name creates one listing stub only — never paste a full
                recruitment dump.
              </p>
              <button type="submit">Import one row</button>
            </form>
          </>
        )}

        <p className={styles.sub} style={{ marginTop: "1.5rem" }}>
          <Link href="/atlanta">Atlanta pilot</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
      </main>
    </>
  );
}
