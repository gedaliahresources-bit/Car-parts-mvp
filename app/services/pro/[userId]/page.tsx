import Link from "next/link";
import { initSchema } from "@/lib/db";
import { requireOwnProOwner } from "@/lib/auth";
import { listProsForOwner } from "@/lib/services/pros";
import {
  deactivateProAction,
  reactivateProAction,
} from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: { userId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function ProDashboardPage({
  params,
  searchParams,
}: Props) {
  await initSchema();
  const userId = Number(params.userId);
  const session = await requireOwnProOwner(userId);
  const pros = await listProsForOwner(userId);

  const flashKind = one(searchParams.created)
    ? "created"
    : one(searchParams.updated)
      ? "updated"
      : one(searchParams.deactivated)
        ? "deactivated"
        : one(searchParams.reactivated)
          ? "reactivated"
          : null;
  const flash =
    one(searchParams.created) ||
    one(searchParams.updated) ||
    one(searchParams.deactivated) ||
    one(searchParams.reactivated);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>My pro profiles</h1>
          <p className={styles.sub}>
            {session.displayName} · {pros.length} profile
            {pros.length === 1 ? "" : "s"}
          </p>
        </header>

        {flashKind && (
          <p className={styles.flash} role="status">
            Profile #{flash} {flashKind}.
          </p>
        )}

        <p style={{ marginTop: "1rem" }}>
          <Link href={`/services/pro/${userId}/new`}>+ New pro profile</Link>
          {" · "}
          <Link href="/services">Search (homeowner view)</Link>
        </p>

        {pros.length === 0 ? (
          <p className={styles.empty}>No pro profiles yet.</p>
        ) : (
          <ul className={styles.list}>
            {pros.map((p) => (
              <li key={p.id} className={styles.card}>
                <div className={styles.cardTitle}>
                  <strong style={{ textTransform: "none" }}>
                    {p.business_name}
                  </strong>
                  <span
                    className={`${styles.badge} ${p.active ? "" : styles.badgeOff}`}
                  >
                    {p.active ? "active" : "inactive"}
                  </span>
                </div>
                <dl className={styles.meta}>
                  <div>
                    <dt>Trade</dt>
                    <dd>{p.trade_list.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{p.service_area}</dd>
                  </div>
                  <div>
                    <dt>License</dt>
                    <dd>
                      {p.license_status === "verified"
                        ? `verified (${p.license_source_name})`
                        : p.license_status}
                    </dd>
                  </div>
                  <div>
                    <dt>Experience</dt>
                    <dd>{p.years_experience} yrs</dd>
                  </div>
                </dl>
                <div className={styles.rowActions}>
                  <Link href={`/services/pro/${userId}/${p.id}/edit`}>
                    Edit
                  </Link>
                  <Link href={`/services/pros/${p.id}`}>View (public)</Link>
                  {p.active ? (
                    <form action={deactivateProAction}>
                      <input type="hidden" name="pro_id" value={p.id} />
                      <input type="hidden" name="owner_user_id" value={userId} />
                      <button type="submit" className={styles.dangerBtn}>
                        Deactivate
                      </button>
                    </form>
                  ) : (
                    <form action={reactivateProAction}>
                      <input type="hidden" name="pro_id" value={p.id} />
                      <input type="hidden" name="owner_user_id" value={userId} />
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
