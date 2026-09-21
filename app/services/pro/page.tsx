import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Gate: login required; go to own pro dashboard. */
export default async function ProGatePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/services/pro");
  }
  redirect(`/services/pro/${session.id}`);
}
