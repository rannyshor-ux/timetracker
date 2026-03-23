"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { decimalToHMS, hmsToDecimal } from "@/lib/timeFormat";

type Employee = { id: number; name: string };
type Project = { id: number; name: string; phases: { id: number; name: string }[] };
type TimeEntry = {
  id: number; hours: number; date: string; description: string;
  employee: { id: number; name: string; role: string | null };
  phase: { id: number; name: string; project: { id: number; name: string; client: string | null } };
};

const filterInputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";
const modalInputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";
const labelClass = "block text-sm font-medium text-gray-400";

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPhases, setFilterPhases] = useState<string[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Edit modal state
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editPhaseId, setEditPhaseId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadFilters() {
    const [emps, projs] = await Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setEmployees(emps);
    setProjects(projs);
  }

  async function loadEntries() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEmployee) params.set("employeeId", filterEmployee);
    if (filterProject) params.set("projectId", filterProject);
    if (filterPhases.length > 0) params.set("phaseNames", filterPhases.join(","));
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const data = await fetch(`/api/time-entries?${params}`).then((r) => r.json());
    setEntries(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFilters();
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportExcel() {
    const rows = entries.map((e) => ({
      "תאריך": new Date(e.date).toLocaleDateString("he-IL"),
      "עובד": e.employee.name,
      "פרויקט": e.phase.project.name,
      "שלב": e.phase.name,
      "שעות": decimalToHMS(e.hours),
      "שעות (עשרוני)": e.hours,
      "תיאור": e.description,
    }));
    rows.push({
      "תאריך": "",
      "עובד": "",
      "פרויקט": "",
      "שלב": "סה״כ",
      "שעות": decimalToHMS(totalHours),
      "שעות (עשרוני)": totalHours,
      "תיאור": "",
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "שעות עבודה");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `שעות_עבודה_${date}.xlsx`);
  }

  function exportPDF() {
    const dateLabel = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
    const rows = entries.map((e, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
        <td>${new Date(e.date).toLocaleDateString("he-IL")}</td>
        <td>${e.employee.name}</td>
        <td>${e.phase.project.name}</td>
        <td>${e.phase.name}</td>
        <td style="font-weight:600;text-align:center">${decimalToHMS(e.hours)}</td>
        <td style="color:#555">${e.description}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><title>דוח שעות עבודה</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 32px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p.sub { color: #666; font-size: 12px; margin: 0 0 20px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e293b; color: #fff; padding: 8px 10px; text-align: right; font-size: 11px; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      .total td { font-weight: bold; background: #f1f5f9; border-top: 2px solid #cbd5e1; }
      @media print { body { margin: 16px; } }
    </style></head>
    <body>
      <h1>דוח שעות עבודה</h1>
      <p class="sub">הופק בתאריך ${dateLabel} | ${entries.length} רשומות | סה״כ ${decimalToHMS(totalHours)}</p>
      <table>
        <thead><tr><th>תאריך</th><th>עובד</th><th>פרויקט</th><th>שלב</th><th>שעות</th><th>תיאור</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="total"><td></td><td></td><td></td><td>סה״כ</td><td style="text-align:center">${decimalToHMS(totalHours)}</td><td></td></tr>
        </tbody>
      </table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק רשומה זו?")) return;
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    loadEntries();
  }

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry);
    setEditEmployeeId(String(entry.employee.id));
    setEditProjectId(String(entry.phase.project.id));
    setEditPhaseId(String(entry.phase.id));
    setEditDate(entry.date.split("T")[0]);
    setEditHours(decimalToHMS(entry.hours));
    setEditDescription(entry.description);
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEntry) return;
    setEditError("");
    const hoursDecimal = hmsToDecimal(editHours);
    if (!editEmployeeId || !editPhaseId || !editDate || hoursDecimal === null || hoursDecimal <= 0 || !editDescription.trim()) {
      setEditError("נא למלא את כל השדות כראוי");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/time-entries/${editEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: Number(editEmployeeId),
          phaseId: Number(editPhaseId),
          date: editDate,
          hours: editHours,
          description: editDescription,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בשמירה");
      }
      setEditEntry(null);
      loadEntries();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setEditSaving(false);
    }
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);

  const availablePhases: string[] = filterProject
    ? [...new Set((projects.find((p) => String(p.id) === filterProject)?.phases ?? []).map((ph) => ph.name))]
    : [...new Set(projects.flatMap((p) => p.phases.map((ph) => ph.name)))];

  const editProjectPhases = projects.find((p) => String(p.id) === editProjectId)?.phases ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">דוחות שעות</h1>
        <p className="text-gray-500 text-sm mt-1">חיפוש וסינון רישומי שעות</p>
      </div>

      {/* Edit Modal */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-5">עריכת רשומה</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>עובד</label>
                  <select value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} className={modalInputClass}>
                    <option value="">— בחר —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>תאריך</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={modalInputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>פרויקט</label>
                <select value={editProjectId} onChange={(e) => { setEditProjectId(e.target.value); setEditPhaseId(""); }} className={modalInputClass}>
                  <option value="">— בחר פרויקט —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>שלב</label>
                <select
                  value={editPhaseId}
                  onChange={(e) => setEditPhaseId(e.target.value)}
                  disabled={!editProjectId}
                  className={modalInputClass}
                  style={{ opacity: !editProjectId ? 0.4 : 1 }}
                >
                  <option value="">— בחר שלב —</option>
                  {editProjectPhases.map((ph) => (
                    <option key={ph.id} value={ph.id}>{ph.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>משך זמן</label>
                  <input
                    type="text"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    placeholder="01:30"
                    className={modalInputClass}
                  />
                  {editHours && (() => {
                    const parsed = hmsToDecimal(editHours);
                    if (parsed === null || parsed <= 0) return (
                      <p className="text-xs text-red-400">פורמט לא תקין</p>
                    );
                    const totalMin = Math.round(parsed * 60);
                    const h = Math.floor(totalMin / 60);
                    const m = totalMin % 60;
                    const label = h > 0 && m > 0 ? `${h} שעות ו-${m} דקות` : h > 0 ? `${h} שעות` : `${m} דקות`;
                    return <p className="text-xs text-amber-400">= {label}</p>;
                  })()}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>תיאור</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className={modalInputClass + " resize-none"}
                />
              </div>

              {editError && (
                <p className="text-red-400 text-sm">{editError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editSaving} className="flex-1 bg-amber-500 text-gray-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50">
                  {editSaving ? "שומר..." : "שמור"}
                </button>
                <button type="button" onClick={() => setEditEntry(null)} className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-800">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">עובד</label>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className={filterInputClass}>
              <option value="">כל העובדים</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">פרויקט</label>
            <select value={filterProject} onChange={(e) => { setFilterProject(e.target.value); setFilterPhases([]); }} className={filterInputClass}>
              <option value="">כל הפרויקטים</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">מתאריך</label>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className={filterInputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">עד תאריך</label>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className={filterInputClass} />
          </div>
        </div>

        {/* Phase checkboxes */}
        {availablePhases.length > 0 && (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">שלבים</label>
            <div className="flex flex-wrap gap-2">
              {availablePhases.map((phaseName) => {
                const checked = filterPhases.includes(phaseName);
                return (
                  <button
                    key={phaseName}
                    type="button"
                    onClick={() => setFilterPhases((prev) =>
                      checked ? prev.filter((n) => n !== phaseName) : [...prev, phaseName]
                    )}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      checked
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                      checked ? "bg-amber-500 border-amber-500 text-gray-900" : "border-gray-600"
                    }`}>
                      {checked && "✓"}
                    </span>
                    {phaseName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={loadEntries} className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
            חפש
          </button>
          <button
            onClick={() => { setFilterEmployee(""); setFilterProject(""); setFilterPhases([]); setFilterFrom(""); setFilterTo(""); setTimeout(loadEntries, 0); }}
            className="border border-gray-700 text-gray-400 px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            נקה
          </button>
        </div>
      </div>

      {/* Summary + Export */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="font-medium text-gray-200 text-base">{entries.length} רשומות</span>
            <span>|</span>
            <span>סה"כ: <strong className="text-amber-400">{decimalToHMS(totalHours)}</strong></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-colors"
            >
              ↓ Excel
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400 transition-colors"
            >
              ↓ PDF
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">טוען...</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">אין רשומות עבור הסינון הנבחר</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/60">
                  <th className="text-right font-medium text-gray-500 px-5 py-3">תאריך</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">עובד</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">פרויקט</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">שלב</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">שעות</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">תיאור</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-800/40">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-200 whitespace-nowrap">{entry.employee.name}</td>
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{entry.phase.project.name}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{entry.phase.name}</td>
                    <td className="px-5 py-3 font-semibold text-amber-400 whitespace-nowrap">{decimalToHMS(entry.hours)}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{entry.description}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(entry)} className="text-gray-400 hover:text-gray-100 text-xs">
                          עריכה
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-400 text-xs">
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
