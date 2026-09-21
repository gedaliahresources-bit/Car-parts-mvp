import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { signInAction } from "@/app/actions";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";
import formStyles from "@/app/components/ListingForm.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  const next = one(searchParams.next) || "/";
  if (session) {
    if (session.role === "seller" && (next === "/" || next === "/seller")) {
      redirect(`/seller/${session.id}`);
    }
    redirect(next.startsWith("/") ? next : "/");
  }

  const error = one(searchParams.error);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Sign in</h1>
          <p className={styles.sub}>
            Email + password. Seeded demo password: <code>demo1234</code>
          </p>
        </header>

        {error && (
          <p className={styles.blocked} role="alert" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        )}

        <form action={signInAction} className={formStyles.form} style={{ marginTop: "1rem" }}>
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </label>
          <button type="submit">Sign in</button>
        </form>

        <p className={styles.sub} style={{ marginTop: "1rem" }}>
          No account? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Sign up</Link>
        </p>
      </main>
    </>
  );
}
