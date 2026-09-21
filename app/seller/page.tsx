import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

/** Gate: login required; sellers go to their own inventory. No open picker. */
export default async function SellerGatePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/seller");
  }
  if (session.role === "seller") {
    redirect(`/seller/${session.id}`);
  }

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Seller inventory</h1>
          <p className={styles.sub}>
            You&apos;re signed in as a buyer. Create a seller account to manage
            listings (or sign out and sign up as a seller).
          </p>
        </header>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/signup">Sign up as seller</Link>
          {" · "}
          <Link href="/">Back to search</Link>
        </p>
      </main>
    </>
  );
}
