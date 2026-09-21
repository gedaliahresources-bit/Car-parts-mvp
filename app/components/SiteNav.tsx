import Link from "next/link";
import styles from "./SiteNav.module.css";

export function SiteNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/">Buyer search</Link>
      <Link href="/seller">Seller inventory</Link>
    </nav>
  );
}
