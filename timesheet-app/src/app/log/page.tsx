"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { hmsToDecimal, decimalToHMS } from "@/lib/timeFormat";

type Employee = { id: number; name: string; role: string | null };
type Phase = { id: number; name: string; order: number };
type Project = { id: number; name: string; client: string | null; status: string; phases: Phase[] };

const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";
const labelClass = "block text-sm font-medium text-gray-400";

function LogPageContent() {
  const searchParams = useSearchParams();
  const defaultDate = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lastEmployeeId");
    if (saved) setEmployeeId(saved);

    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data.filter((p) => p.status === "active"));
      });
  }, []);

  function handleEmployeeChange(id: string) {
    setEmployeeId(id);
    if (id) localStorage.setItem("lastEmployeeId", id);
  }

  // Get phases directly from the already-loaded project data
  const selectedProject = projects.find((p) => String(p.id) === projectId);
  const phases: Phase[] = selectedProject?.phases ?? [];

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setProjectId(e.target.value);
    setPhaseId(""); // reset phase when project changes
  }

  async function performSave(keepContext: boolean) {
    setError("");
    if (!employeeId || !phaseId || !date || !hours || !description.trim()) {
      setError("נא למלא את כל השדות");
      return;
    }
    const hoursDecimal = hmsToDecimal(hours);
    if (hoursDecimal === null || hoursDecimal <= 0) {
      setError("פורמט שעות לא תקין — יש להזין בפורמט שע:דק (למשל 01:30)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          phaseId: Number(phaseId),
          date,
          hours: hoursDecimal,
          description,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה בשמירה");
      }
      setSuccess(true);
      setHours("");
      setDescription("");
      if (keepContext) {
        setProjectId("");
        setPhaseId("");
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performSave(false);
  }

  function addHours(amount: number) {
    const current = hmsToDecimal(hours) ?? 0;
    setHours(decimalToHMS(current + amount));
  }

  async function handleAddMore(e: React.MouseEvent) {
    e.preventDefault();
    await performSave(true);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">הזנת שעות עבודה</h1>
        <p className="text-gray-500 text-sm mt-1">רשום את שעות העבודה לפי פרויקט ושלב</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee */}
          <div className="space-y-1.5">
            <label className={labelClass}>עובד</label>
            <select value={employeeId} onChange={(e) => handleEmployeeChange(e.target.value)} className={inputClass}>
              <option value="">— בחר עובד —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}{emp.role ? ` (${emp.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <label className={labelClass}>פרויקט</label>
            <select value={projectId} onChange={handleProjectChange} className={inputClass}>
              <option value="">— בחר פרויקט —</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}{proj.client ? ` — ${proj.client}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Phase */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              שלב
              {projectId && phases.length === 0 && (
                <span className="text-amber-500 text-xs mr-2">(אין שלבים לפרויקט זה)</span>
              )}
            </label>
            <select
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              disabled={!projectId || phases.length === 0}
              className={inputClass}
              style={{ opacity: (!projectId || phases.length === 0) ? 0.4 : 1 }}
            >
              <option value="">— בחר שלב —</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>{phase.name}</option>
              ))}
            </select>
          </div>

          {/* Date + Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>תאריך</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>משך זמן</label>
              <input
                type="text"
                value={hours} onChange={(e) => setHours(e.target.value)}
                placeholder="01:30 או 1.5" className={inputClass}
              />
              <div className="flex gap-1.5">
                {[{ label: "+30 דק׳", val: 0.5 }, { label: "+1", val: 1 }, { label: "+2", val: 2 }].map(({ label, val }) => (
                  <button key={val} type="button" onClick={() => addHours(val)}
                    className="flex-1 text-xs py-1 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelClass}>מה עשית?</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="תאר בקצרה את העבודה שבוצעה..."
              className={inputClass + " resize-none"}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg px-4 py-3 text-sm">
              ✓ השעות נשמרו בהצלחה!
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-amber-500 text-gray-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {loading ? "שומר..." : "שמור שעות"}
            </button>
            <button
              type="button" onClick={handleAddMore} disabled={loading}
              className="flex-1 border border-amber-500 text-amber-400 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              שמור והוסף עוד
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogPageContent />
    </Suspense>
  );
}
