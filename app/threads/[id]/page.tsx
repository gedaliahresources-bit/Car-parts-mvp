import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getThread } from "@/lib/threads";
import { getDemoBuyer } from "@/lib/users";
import { sendMessageAction } from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function ThreadPage({ params }: Props) {
  await initSchema();
  const id = Number(params.id);
  const thread = await getThread(id);
  if (!thread) notFound();

  const buyer = await getDemoBuyer();
  const hasContact = Boolean(thread.contact_email || thread.contact_phone);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/listings/${thread.listing_id}`}>
          ← Back to listing
        </Link>
        <header className={styles.header}>
          <h1>Thread #{thread.id}</h1>
          <p className={styles.sub}>
            Re: {thread.listing_part_name} · {thread.buyer_name} ↔{" "}
            {thread.seller_name}
          </p>
        </header>

        <section className={styles.contact}>
          <h2>Seller contact</h2>
          {hasContact ? (
            <ul style={{ listStyle: "none", fontSize: "0.95rem" }}>
              {thread.contact_email && <li>Email: {thread.contact_email}</li>}
              {thread.contact_phone && <li>Phone: {thread.contact_phone}</li>}
            </ul>
          ) : (
            <p className={styles.blocked}>
              Seller left no contact method — use this thread only.
            </p>
          )}
        </section>

        {thread.messages.length === 0 ? (
          <p className={styles.empty}>No messages yet.</p>
        ) : (
          <ul className={styles.messages}>
            {thread.messages.map((m) => (
              <li key={m.id} className={styles.msg}>
                <div className={styles.msgHead}>
                  {m.sender_name} · {m.created_at}
                </div>
                <div>{m.body}</div>
              </li>
            ))}
          </ul>
        )}

        {buyer && (
          <section className={styles.messageBox}>
            <form action={sendMessageAction}>
              <input type="hidden" name="thread_id" value={thread.id} />
              <input type="hidden" name="sender_id" value={buyer.id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Write a message…"
              />
              <button type="submit">Send</button>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
