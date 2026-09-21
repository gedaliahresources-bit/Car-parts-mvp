import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getUser } from "@/lib/users";
import { ListingForm } from "@/app/components/ListingForm";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { sellerId: string } };

export default async function NewListingPage({ params }: Props) {
  await initSchema();
  const sellerId = Number(params.sellerId);
  const seller = await getUser(sellerId);
  if (!seller || seller.role !== "seller") notFound();

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/seller/${sellerId}`}>
          ← Back to inventory
        </Link>
        <header className={styles.header}>
          <h1>New listing</h1>
          <p className={styles.sub}>{seller.display_name}</p>
        </header>
        <ListingForm sellerId={sellerId} />
      </main>
    </>
  );
}
