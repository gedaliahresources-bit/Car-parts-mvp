import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getServiceThread } from "@/lib/services/leads";
import { getSession } from "@/lib/auth";
import { sendServiceMessageAction } from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function ServiceThreadPage({
  params,
  searchParams,
}: Props) {
  await initSchema();
  const id = Number(params.id);
  const thread = await getServiceThread(id);
  if (!thread) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/services/threads/${id}`)}`);
  }
  const isHomeowner = session.id === thread.homeowner_id;
  const isProOwner =
    thread.pro_owner_id != null && session.id === thread.pro_owner_id;
  if (!isHomeowner && !isProOwner) {
    notFound();
  }

  const hasContact = Boolean(thread.contact_email || thread.contact_phone);
  const leadFlash = one(searchParams.lead);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/services/pros/${thread.pro_id}`}>
          ← Back to pro
        </Link>
        <header className={styles.header}>
          <h1>Service thread #{thread.id}</h1>
          <p className={styles.sub}>
            Re: {thread.pro_business_name} · {thread.homeowner_name}
          </p>
        </header>

        {leadFlash && (
          <p className={styles.flash} role="status">
            Lead #{leadFlash} saved and attached to this thread.
          </p>
        )}

        <section className={styles.contact}>
          <h2>Pro contact</h2>
          {hasContact ? (
            <ul style={{ listStyle: "none", fontSize: "0.95rem" }}>
              {thread.contact_email && <li>Email: {thread.contact_email}</li>}
              {thread.contact_phone && <li>Phone: {thread.contact_phone}</li>}
            </ul>
          ) : (
            <p className={styles.blocked}>
              Pro left no contact method — use this thread only.
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
                <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
              </li>
            ))}
          </ul>
        )}

        <section className={styles.messageBox}>
          <form action={sendServiceMessageAction}>
            <input type="hidden" name="thread_id" value={thread.id} />
            <textarea
              name="body"
              rows={3}
              required
              placeholder="Write a message…"
            />
            <button type="submit">Send</button>
          </form>
        </section>
      </main>
    </>
  );
}
