"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const allNavItems = [
  { href: "/", label: "לוח בקרה", adminOnly: false },
  { href: "/log", label: "הזנת שעות", adminOnly: false },
  { href: "/reports", label: "דוחות", adminOnly: false },
  { href: "/projects", label: "פרויקטים", adminOnly: true },
  { href: "/employees", label: "עובדים", adminOnly: true },
  { href: "/import", label: "ייבוא Clockify", adminOnly: true },
];

export default function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {navItems.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? "text-amber-400 bg-amber-500/10 font-medium"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
