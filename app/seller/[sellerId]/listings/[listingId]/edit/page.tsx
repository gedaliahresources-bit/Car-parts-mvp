import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getUser } from "@/lib/users";
import { getListing } from "@/lib/listings";
import { ListingForm } from "@/app/components/ListingForm";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { sellerId: string; listingId: string } };

export default async function EditListingPage({ params }: Props) {
  await initSchema();
  const sellerId = Number(params.sellerId);
  const listingId = Number(params.listingId);
  const seller = await getUser(sellerId);
  if (!seller || seller.role !== "seller") notFound();

  const listing = await getListing(listingId);
  if (!listing || listing.seller_id !== sellerId) notFound();

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/seller/${sellerId}`}>
          ← Back to inventory
        </Link>
        <header className={styles.header}>
          <h1>Edit listing #{listing.id}</h1>
          <p className={styles.sub}>{seller.display_name}</p>
        </header>
        <ListingForm sellerId={sellerId} listing={listing} />
      </main>
    </>
  );
}
