"use client";

import { useTransition } from "react";
import Button from "@/components/ui/Button";
import { logoutAction } from "@/app/(dealer)/partneri/login/actions";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
    >
      {pending ? "Odjavljujem…" : "Odjava"}
    </Button>
  );
}
