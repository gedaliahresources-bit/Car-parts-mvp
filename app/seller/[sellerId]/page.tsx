import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getUser } from "@/lib/users";
import { listSellerListings } from "@/lib/listings";
import {
  deactivateListingAction,
  reactivateListingAction,
} from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: { sellerId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function SellerInventoryPage({
  params,
  searchParams,
}: Props) {
  await initSchema();
  const sellerId = Number(params.sellerId);
  const seller = await getUser(sellerId);
  if (!seller || seller.role !== "seller") notFound();

  const listings = await listSellerListings(sellerId);
  const flash =
    one(searchParams.created) ||
    one(searchParams.updated) ||
    one(searchParams.deactivated) ||
    one(searchParams.reactivated);
  const flashKind = one(searchParams.created)
    ? "created"
    : one(searchParams.updated)
      ? "updated"
      : one(searchParams.deactivated)
        ? "deactivated"
        : one(searchParams.reactivated)
          ? "reactivated"
          : null;

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href="/seller">
          ← All sellers
        </Link>
        <header className={styles.header}>
          <h1>{seller.display_name}</h1>
          <p className={styles.sub}>
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </header>

        {flashKind && (
          <p className={styles.flash} role="status">
            Listing #{flash} {flashKind}.
          </p>
        )}

        <p style={{ marginTop: "1rem" }}>
          <Link href={`/seller/${sellerId}/new`}>+ New listing</Link>
        </p>

        {listings.length === 0 ? (
          <p className={styles.empty}>No listings yet.</p>
        ) : (
          <ul className={styles.list}>
            {listings.map((L) => (
              <li key={L.id} className={styles.card}>
                <div className={styles.cardTitle}>
                  <strong>{L.part_name}</strong>
                  <span
                    className={`${styles.badge} ${L.active ? "" : styles.badgeOff}`}
                  >
                    {L.active ? "active" : "inactive"}
                  </span>
                </div>
                <dl className={styles.meta}>
                  <div>
                    <dt>Part #</dt>
                    <dd>{L.part_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Condition</dt>
                    <dd>{L.condition}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{L.location}</dd>
                  </div>
                  <div>
                    <dt>Price</dt>
                    <dd>{L.price_text ?? "—"}</dd>
                  </div>
                  <div className={styles.fitment}>
                    <dt>Fitment</dt>
                    <dd>{L.fitment_summary}</dd>
                  </div>
                </dl>
                <div className={styles.rowActions}>
                  <Link href={`/seller/${sellerId}/listings/${L.id}/edit`}>
                    Edit
                  </Link>
                  <Link href={`/listings/${L.id}`}>View (buyer)</Link>
                  {L.active ? (
                    <form action={deactivateListingAction}>
                      <input type="hidden" name="listing_id" value={L.id} />
                      <input type="hidden" name="seller_id" value={sellerId} />
                      <button type="submit" className={styles.dangerBtn}>
                        Deactivate
                      </button>
                    </form>
                  ) : (
                    <form action={reactivateListingAction}>
                      <input type="hidden" name="listing_id" value={L.id} />
                      <input type="hidden" name="seller_id" value={sellerId} />
                      <button type="submit">Reactivate</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
