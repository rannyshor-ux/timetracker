"use client";

import { useEffect, useState } from "react";

type Employee = { id: number; name: string; role: string | null; createdAt: string };

const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await fetch("/api/employees").then((r) => r.json());
    setEmployees(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setName(""); setRole(""); setError(""); setShowForm(true); }
  function openEdit(emp: Employee) { setEditing(emp); setName(emp.name); setRole(emp.role ?? ""); setError(""); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("שם הוא שדה חובה"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/employees/${editing.id}` : "/api/employees";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role: role.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "שגיאה"); }
      closeForm(); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק עובד זה?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">עובדים</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול רשימת העובדים</p>
        </div>
        <button onClick={openNew} className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
          + עובד חדש
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              {editing ? "עריכת עובד" : "עובד חדש"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">שם מלא</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="ישראל ישראלי" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">תפקיד</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} placeholder="אדריכל, מתמחה, מנהל פרויקט..." />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 text-gray-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50">
                  {saving ? "שומר..." : "שמור"}
                </button>
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-800">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">טוען...</div>
        ) : employees.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>אין עובדים עדיין.</p>
            <button onClick={openNew} className="text-amber-400 underline text-sm mt-2">הוסף עובד ראשון</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {employees.map((emp) => (
              <div key={emp.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-100">{emp.name}</p>
                  {emp.role && <p className="text-sm text-gray-500">{emp.role}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(emp)} className="text-sm text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-800">
                    עריכה
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="text-sm text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/30">
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
