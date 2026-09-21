import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getListing } from "@/lib/listings";
import { getSession } from "@/lib/auth";
import { startThreadAction } from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function ListingDetailPage({ params }: Props) {
  await initSchema();
  const id = Number(params.id);
  const listing = await getListing(id);
  if (!listing) notFound();

  const session = await getSession();
  const hasContact = Boolean(listing.contact_email || listing.contact_phone);
  const isOwn = session?.id === listing.seller_id;

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href="/">
          ← Back to search
        </Link>
        <header className={styles.header}>
          <h1 style={{ textTransform: "capitalize" }}>{listing.part_name}</h1>
          <p className={styles.sub}>
            {listing.price_text ? `${listing.price_text} · ` : ""}
            {listing.condition} · {listing.location}
            {!listing.active && " · inactive"}
          </p>
        </header>

        <dl className={styles.meta} style={{ marginTop: "1rem" }}>
          <div>
            <dt>Part #</dt>
            <dd>{listing.part_number ?? "—"}</dd>
          </div>
          <div>
            <dt>Seller</dt>
            <dd>{listing.seller_name}</dd>
          </div>
          <div className={styles.fitment}>
            <dt>Fitment</dt>
            <dd>{listing.fitment_summary}</dd>
          </div>
        </dl>
        {listing.notes && (
          <p className={styles.sub} style={{ marginTop: "0.75rem" }}>
            {listing.notes}
          </p>
        )}

        <section className={styles.contact}>
          <h2>Contact handoff</h2>
          {hasContact ? (
            <ul style={{ listStyle: "none", fontSize: "0.95rem" }}>
              {listing.contact_email && (
                <li>
                  Email:{" "}
                  <a href={`mailto:${listing.contact_email}`}>
                    {listing.contact_email}
                  </a>
                </li>
              )}
              {listing.contact_phone && (
                <li>Phone: {listing.contact_phone}</li>
              )}
            </ul>
          ) : (
            <p className={styles.blocked}>
              Seller left no contact method — handoff blocked. Use in-app
              messaging instead if available.
            </p>
          )}
        </section>

        {listing.active ? (
          isOwn ? (
            <p className={styles.empty}>This is your listing.</p>
          ) : session ? (
            <section className={styles.messageBox}>
              <h2 style={{ fontSize: "1rem" }}>Message seller</h2>
              <p className={styles.sub}>
                Opens an in-app thread as {session.displayName}.
              </p>
              <form action={startThreadAction}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <textarea
                  name="opener"
                  rows={3}
                  placeholder="Hi — is this part still available?"
                  defaultValue="Hi — is this part still available?"
                />
                <button type="submit">Message seller</button>
              </form>
            </section>
          ) : (
            <section className={styles.messageBox}>
              <h2 style={{ fontSize: "1rem" }}>Message seller</h2>
              <p className={styles.sub}>
                <Link
                  href={`/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`}
                >
                  Sign in
                </Link>{" "}
                to open a thread with this seller.
              </p>
            </section>
          )
        ) : (
          <p className={styles.empty}>
            This listing is inactive — messaging is closed.
          </p>
        )}
      </main>
    </>
  );
}
