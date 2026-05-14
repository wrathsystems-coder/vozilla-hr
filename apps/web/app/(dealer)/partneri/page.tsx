import { redirect } from "next/navigation";
import { getDealerSession } from "@/lib/dealer/auth";

// /partneri/ root just sends the visitor to the right place. The actual
// dashboard + login pages land in subsequent Sprint 5 commits.
export default async function DealerRoot() {
  const session = await getDealerSession();
  if (session) redirect("/partneri/dashboard");
  redirect("/partneri/login");
}
