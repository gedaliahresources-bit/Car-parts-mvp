import Link from "next/link";
import { initSchema } from "@/lib/db";
import { requireOwnProOwner } from "@/lib/auth";
import { ProForm } from "@/app/components/ProForm";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { userId: string } };

export default async function NewProPage({ params }: Props) {
  await initSchema();
  const userId = Number(params.userId);
  const session = await requireOwnProOwner(userId);

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/services/pro/${userId}`}>
          ← Back to my profiles
        </Link>
        <header className={styles.header}>
          <h1>New pro profile</h1>
          <p className={styles.sub}>{session.displayName}</p>
        </header>
        <ProForm ownerUserId={userId} />
      </main>
    </>
  );
}
