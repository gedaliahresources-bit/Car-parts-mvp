import Link from "next/link";
import { notFound } from "next/navigation";
import { initSchema } from "@/lib/db";
import { requireOwnProOwner } from "@/lib/auth";
import { getPro } from "@/lib/services/search";
import { ProForm } from "@/app/components/ProForm";
import { SiteNav } from "@/app/components/SiteNav";
import styles from "@/app/shared.module.css";

export const dynamic = "force-dynamic";

type Props = { params: { userId: string; proId: string } };

export default async function EditProPage({ params }: Props) {
  await initSchema();
  const userId = Number(params.userId);
  const proId = Number(params.proId);
  await requireOwnProOwner(userId);

  const pro = await getPro(proId);
  if (!pro || pro.owner_user_id !== userId) notFound();

  return (
    <>
      <SiteNav />
      <main className={styles.main}>
        <Link className={styles.back} href={`/services/pro/${userId}`}>
          ← Back to my profiles
        </Link>
        <header className={styles.header}>
          <h1>Edit pro profile</h1>
          <p className={styles.sub}>{pro.business_name}</p>
        </header>
        <ProForm ownerUserId={userId} pro={pro} />
      </main>
    </>
  );
}
