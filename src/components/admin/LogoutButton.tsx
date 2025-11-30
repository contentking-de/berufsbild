"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
    >
      Abmelden
    </button>
  );
}

