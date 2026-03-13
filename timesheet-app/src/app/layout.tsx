import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import NavLinks from "./components/NavLinks";
import LogoutButton from "./components/LogoutButton";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "מערכת תיעוד שעות | משרד אדריכלים",
  description: "ניהול שעות עבודה למשרד אדריכלים",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="he" dir="rtl">
      <body>
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-1">
                {session && <NavLinks role={session.role} />}
              </div>

              <div className="flex items-center gap-4">
                {session && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs hidden sm:block">{session.username}</span>
                    <LogoutButton />
                  </div>
                )}
                <Link href="/" className="flex items-center py-4">
                  <Image
                    src="/logo-white.png"
                    alt="לוגו"
                    width={80}
                    height={24}
                    className="object-contain"
                    priority
                  />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
