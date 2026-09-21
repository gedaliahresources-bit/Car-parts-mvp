import Link from "next/link";
import { getSession } from "@/lib/auth";
import { signOutAction } from "@/app/actions";
import styles from "./SiteNav.module.css";

export async function SiteNav() {
  const session = await getSession();

  return (
    <nav className={styles.nav}>
      <Link href="/">Buyer search</Link>
      {session?.role === "seller" ? (
        <Link href={`/seller/${session.id}`}>My inventory</Link>
      ) : (
        <Link href="/seller">Seller inventory</Link>
      )}
      <Link href="/services">Home services</Link>
      {session ? (
        <Link href="/services/pro">My pro profiles</Link>
      ) : null}
      <span className={styles.spacer} />
      {session ? (
        <>
          <span className={styles.user}>
            {session.displayName}
            <span className={styles.role}> ({session.role})</span>
          </span>
          <form action={signOutAction}>
            <button type="submit" className={styles.logout}>
              Log out
            </button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}
