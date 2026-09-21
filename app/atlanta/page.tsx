import Link from "next/link";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Openlot Atlanta — pilot",
  description:
    "Openlot Atlanta pilot: real car parts from local yards and home services from local pros.",
};

export default function AtlantaLandingPage() {
  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.sub} style={{ marginBottom: "0.35rem" }}>
            Openlot · one-city pilot
          </p>
          <h1>Atlanta</h1>
          <p className={styles.sub}>
            Find used car parts from local yards, and home-service pros in the
            same metro. Small marketplace — real supply, clear trust labels.
          </p>
        </header>

        <section className={styles.card} style={{ marginTop: "1.25rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
            Car parts
          </h2>
          <p className={styles.sub}>
            Search by part name, number, or vehicle. Message a yard when you
            find a match. No checkout yet — handoff is the product.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <Link href="/">Search parts</Link>
            {" · "}
            <Link href="/signup?role=seller&next=/seller">
              Yard: list real parts
            </Link>
            {" · "}
            <Link href="/seller">Seller inventory</Link>
          </p>
        </section>

        <section className={styles.card} style={{ marginTop: "0.75rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
            Home services
          </h2>
          <p className={styles.sub}>
            Browse pros by trade and area. License claims are labeled{" "}
            <strong>verified</strong> (with a named source) or{" "}
            <strong>unverified</strong> — we do not invent credentials.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <Link href="/services?location=Atlanta">Find pros</Link>
            {" · "}
            <Link href="/services/pro">Pro: list your profile</Link>
            {" · "}
            <Link href="/signup">Sign up</Link>
          </p>
        </section>

        <section className={styles.card} style={{ marginTop: "0.75rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
            Trust (honest)
          </h2>
          <ul
            className={styles.sub}
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            <li>
              Inventory and pro profiles come from people who opted in — not
              scraped dumps auto-published as live stock.
            </li>
            <li>
              Demo seed data may exist on fresh DBs for walkthroughs; treat it as
              sample, not Atlanta street inventory.
            </li>
            <li>
              No payments on Openlot yet. You talk to the yard or pro directly
              through the app.
            </li>
            <li>
              Yards and pros: after a verbal or email yes, use signup or ask
              Immanuel to add you — we will not fake your parts or reviews.
            </li>
          </ul>
        </section>

        <p className={styles.sub} style={{ marginTop: "1.5rem" }}>
          Brand: <strong>Openlot</strong> — local match, not a black-box
          checkout.
        </p>
      </main>
    </>
  );
}
