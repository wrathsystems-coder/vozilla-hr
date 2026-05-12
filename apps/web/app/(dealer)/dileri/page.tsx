import { redirect } from "next/navigation";
import { getDealerSession } from "@/lib/dealer/auth";

// /dileri/ root just sends the visitor to the right place. The actual
// dashboard + login pages land in subsequent Sprint 5 commits.
export default async function DealerRoot() {
  const session = await getDealerSession();
  if (session) redirect("/dileri/dashboard");
  redirect("/dileri/login");
}
