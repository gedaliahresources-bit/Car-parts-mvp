import Link from "next/link";
import { initSchema } from "@/lib/db";
import { listSellers } from "@/lib/users";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

export default async function SellerPickerPage() {
  await initSchema();
  const sellers = await listSellers();

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Seller inventory</h1>
          <p className={styles.sub}>
            Demo auth stub — pick a seeded seller to manage listings.
          </p>
        </header>
        {sellers.length === 0 ? (
          <p className={styles.empty}>
            No sellers found. Run <code>npm run demo:seed</code>.
          </p>
        ) : (
          <ul className={styles.sellerPick}>
            {sellers.map((s) => (
              <li key={s.id}>
                <Link href={`/seller/${s.id}`}>
                  <strong>{s.display_name}</strong>
                  <div className={styles.sub}>
                    {[s.contact_email, s.contact_phone].filter(Boolean).join(" · ") ||
                      "No contact on file"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
