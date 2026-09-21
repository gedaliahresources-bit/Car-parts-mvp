import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

/**
 * Gate: logged-in users go to their pro dashboard.
 * Anonymous visitors see Atlanta pro onboarding copy.
 */
export default async function ProGatePage() {
  const session = await getSession();
  if (session) {
    redirect(`/services/pro/${session.id}`);
  }

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Pro profiles</h1>
          <p className={styles.sub}>
            List your trade, service area, and contact info so Atlanta
            homeowners can find you on Openlot.
          </p>
        </header>

        <section className={styles.card} style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.95rem", margin: 0 }}>
            <strong>Atlanta pros:</strong> create an account, then add a
            profile under My pro profiles. New listings start as{" "}
            <em>unverified</em> for license status until you (or admin) attach a
            named verification source — we will not claim you are licensed
            without one.{" "}
            <Link href="/atlanta">Atlanta pilot</Link>
          </p>
        </section>

        <p style={{ marginTop: "1rem" }}>
          <Link href="/login?next=/services/pro">Sign in</Link>
          {" · "}
          <Link href="/signup?next=/services/pro">Sign up</Link>
          {" · "}
          <Link href="/services?location=Atlanta">Browse pros</Link>
        </p>
      </main>
    </>
  );
}
