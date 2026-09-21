import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { signUpAction } from "@/app/actions";
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

export default async function SignupPage({ searchParams }: Props) {
  const session = await getSession();
  const next = one(searchParams.next) || "/";
  if (session) {
    redirect(session.role === "seller" ? `/seller/${session.id}` : "/");
  }

  const error = one(searchParams.error);
  const roleDefault =
    one(searchParams.role) === "seller" ? "seller" : "buyer";

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Sign up</h1>
          <p className={styles.sub}>
            Create a buyer or seller account. Sellers can also message other
            yards as buyers.
          </p>
        </header>

        <section className={styles.card} style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.95rem", margin: 0 }}>
            <strong>Atlanta yards:</strong> list real parts on Openlot. Choose
            role <em>Seller</em>, then add inventory from your dashboard.{" "}
            <Link href="/atlanta">Atlanta pilot</Link>
            {" · "}
            <Link href="/seller">Seller inventory</Link>
          </p>
        </section>

        {error && (
          <p className={styles.blocked} role="alert" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        )}

        <form action={signUpAction} className={formStyles.form} style={{ marginTop: "1rem" }}>
          <input type="hidden" name="next" value={next} />
          <label>
            Display name *
            <input
              name="display_name"
              required
              placeholder="Your name or yard name"
            />
          </label>
          <label>
            Email *
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password * (min 6)
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <label>
            Role *
            <select name="role" defaultValue={roleDefault} required>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller (can also buy)</option>
            </select>
          </label>
          <label>
            Contact phone (sellers)
            <input name="contact_phone" type="tel" placeholder="optional" />
          </label>
          <button type="submit">Create account</button>
        </form>

        <p className={styles.sub} style={{ marginTop: "1rem" }}>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </main>
    </>
  );
}
