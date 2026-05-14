import Link from "next/link";
import Container from "@/components/ui/Container";
import LogoutButton from "@/components/dealer/LogoutButton";
import { requireDealer } from "@/lib/dealer/auth";

// Wraps every authenticated dealer page in the shell (top bar w/ logo +
// dealer name + logout). requireDealer() in here gates the whole subtree
// so individual pages only re-run the check when they need the session
// for filtering / mutations.

export default async function DealerAuthedLayout({ children }: { children: React.ReactNode }) {
  const { dealer } = await requireDealer("/partneri/dashboard");

  return (
    <>
      <header className="border-surface-border bg-surface border-b">
        <Container className="flex items-center justify-between py-4">
          <Link href="/partneri/dashboard" className="font-semibold">
            vozilla.hr <span className="text-text-muted font-normal">— dileri</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/partneri/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/partneri/profil" className="hover:underline">
              Profil
            </Link>
            <span className="text-text-muted hidden sm:inline">{dealer.legal_name}</span>
            <LogoutButton />
          </nav>
        </Container>
      </header>
      <main>{children}</main>
    </>
  );
}
