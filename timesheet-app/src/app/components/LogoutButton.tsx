"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-400 hover:text-gray-100 text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
    >
      יציאה
    </button>
  );
}
