import Link from "next/link";
import { initSchema } from "@/lib/db";
import { requireOwnSeller } from "@/lib/auth";
import { ListingForm } from "@/app/components/ListingForm";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { sellerId: string } };

export default async function NewListingPage({ params }: Props) {
  await initSchema();
  const sellerId = Number(params.sellerId);
  const session = await requireOwnSeller(sellerId);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/seller/${sellerId}`}>
          ← Back to inventory
        </Link>
        <header className={styles.header}>
          <h1>New listing</h1>
          <p className={styles.sub}>{session.displayName}</p>
        </header>
        <ListingForm sellerId={sellerId} />
      </main>
    </>
  );
}
