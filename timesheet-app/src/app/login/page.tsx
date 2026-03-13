"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "שגיאה בהתחברות");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo-white.png" alt="לוגו" width={120} height={36} className="object-contain" priority />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h1 className="text-xl font-semibold text-white text-center mb-6">כניסה למערכת</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-medium rounded-lg py-2 text-sm transition-colors"
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
