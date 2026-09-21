import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { getPro } from "@/lib/services/search";
import { getSession } from "@/lib/auth";
import {
  submitServiceLeadAction,
  startServiceThreadAction,
} from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import type { ServicePro } from "@/lib/services/pros";
import styles from "@/app/shared.module.css";
import svc from "@/app/services/page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function LicenseBadge({ pro }: { pro: ServicePro }) {
  if (pro.license_status === "verified") {
    const sourceName = pro.license_source_name ?? "verification source";
    return (
      <div className={svc.licenseBlock}>
        <span className={`${svc.badge} ${svc.badgeVerified}`}>verified</span>
        <span className={svc.licenseDetail}>
          {pro.license_number ? <>License #{pro.license_number} · </> : null}
          {pro.license_source_url ? (
            <a
              href={pro.license_source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceName}
            </a>
          ) : (
            sourceName
          )}
          {pro.license_checked_on
            ? ` · checked ${pro.license_checked_on}`
            : null}
        </span>
      </div>
    );
  }
  if (pro.license_status === "not_applicable") {
    return (
      <div className={svc.licenseBlock}>
        <span className={`${svc.badge} ${svc.badgeNa}`}>not applicable</span>
        <span className={svc.licenseDetail}>
          No license claim is made for this listing (self-declared).
        </span>
      </div>
    );
  }
  return (
    <div className={svc.licenseBlock}>
      <span className={`${svc.badge} ${svc.badgeUnverified}`}>unverified</span>
      <span className={svc.licenseDetail}>
        License not verified — do not treat as licensed.
      </span>
    </div>
  );
}

export default async function ProDetailPage({ params, searchParams }: Props) {
  await initSchema();
  const id = Number(params.id);
  const pro = await getPro(id);
  if (!pro) notFound();

  const session = await getSession();
  const isOwn =
    session != null &&
    pro.owner_user_id != null &&
    session.id === pro.owner_user_id;
  const leadFlash = one(searchParams.lead);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href="/services">
          ← Back to search
        </Link>
        <header className={styles.header}>
          <h1>{pro.business_name}</h1>
          <p className={styles.sub}>
            {pro.trade_list.join(", ")} · {pro.service_area}
            {!pro.active && " · inactive"}
          </p>
        </header>

        <LicenseBadge pro={pro} />

        <dl className={styles.meta} style={{ marginTop: "1rem" }}>
          <div>
            <dt>Experience</dt>
            <dd>
              {pro.years_experience} year
              {pro.years_experience === 1 ? "" : "s"} (self-declared)
            </dd>
          </div>
          {pro.specialties && (
            <div>
              <dt>Specialties</dt>
              <dd>{pro.specialties}</dd>
            </div>
          )}
        </dl>
        {pro.notes && (
          <p className={styles.sub} style={{ marginTop: "0.75rem" }}>
            {pro.notes}
          </p>
        )}

        <section className={styles.contact}>
          <h2>Contact handoff</h2>
          {pro.contact_email || pro.contact_phone ? (
            <ul style={{ listStyle: "none", fontSize: "0.95rem" }}>
              {pro.contact_email && (
                <li>
                  Email:{" "}
                  <a href={`mailto:${pro.contact_email}`}>{pro.contact_email}</a>
                </li>
              )}
              {pro.contact_phone && <li>Phone: {pro.contact_phone}</li>}
            </ul>
          ) : (
            <p className={styles.blocked}>
              No public contact listed — use a lead or in-app message.
            </p>
          )}
        </section>

        {leadFlash && (
          <p className={styles.flash} role="status">
            Lead #{leadFlash} saved.
          </p>
        )}

        {pro.active ? (
          isOwn ? (
            <p className={styles.empty}>
              This is your profile.{" "}
              <Link href={`/services/pro/${session!.id}/${pro.id}/edit`}>
                Edit
              </Link>
            </p>
          ) : session ? (
            <>
              <section className={styles.messageBox}>
                <h2 style={{ fontSize: "1rem" }}>Send a lead</h2>
                <p className={styles.sub}>
                  As {session.displayName}. Saves a job request and opens a
                  message thread — no email/SMS blast.
                </p>
                <form action={submitServiceLeadAction}>
                  <input type="hidden" name="pro_id" value={pro.id} />
                  <label>
                    Job description *
                    <textarea
                      name="job_description"
                      rows={3}
                      required
                      placeholder="Describe the job…"
                      defaultValue="Need a plumber for a leaking kitchen faucet."
                    />
                  </label>
                  <label>
                    Preferred timing
                    <input
                      name="preferred_timing"
                      placeholder="e.g. weekday mornings next week"
                      defaultValue="Weekday mornings"
                    />
                  </label>
                  <button type="submit">Send lead</button>
                </form>
              </section>
              <section className={styles.messageBox}>
                <h2 style={{ fontSize: "1rem" }}>Or message only</h2>
                <form action={startServiceThreadAction}>
                  <input type="hidden" name="pro_id" value={pro.id} />
                  <textarea
                    name="opener"
                    rows={2}
                    placeholder="Hi — are you available for a small job?"
                    defaultValue="Hi — are you available for a small job?"
                  />
                  <button type="submit">Open message thread</button>
                </form>
              </section>
            </>
          ) : (
            <section className={styles.messageBox}>
              <h2 style={{ fontSize: "1rem" }}>Send a lead / message</h2>
              <p className={styles.sub}>
                <Link
                  href={`/login?next=${encodeURIComponent(`/services/pros/${pro.id}`)}`}
                >
                  Sign in
                </Link>{" "}
                to send a lead or open a thread with this pro.
              </p>
            </section>
          )
        ) : (
          <p className={styles.empty}>
            This profile is inactive — leads and messaging are closed.
          </p>
        )}
      </main>
    </>
  );
}
