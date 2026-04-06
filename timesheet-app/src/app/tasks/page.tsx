"use client";

import { useEffect, useState } from "react";

type Project = { id: number; name: string };
type Task = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  project: { id: number; name: string } | null;
};

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "done">("all");
  const [filterProject, setFilterProject] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [t, p] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setTasks(t);
    setProjects(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setTitle("");
    setProjectId("");
    setDueDate("");
    setError("");
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setTitle(task.title);
    setProjectId(task.project ? String(task.project.id) : "");
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("תיאור המשימה הוא שדה חובה"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PUT" : "POST";
      const body = { title, projectId: projectId || null, dueDate: dueDate || null, status: editing?.status ?? "open" };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "שגיאה"); }
      closeForm();
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally { setSaving(false); }
  }

  async function handleToggleStatus(task: Task) {
    const newStatus = task.status === "open" ? "done" : "open";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, projectId: task.project?.id ?? null, dueDate: task.dueDate ?? null, status: newStatus }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק משימה זו?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterProject && String(t.project?.id) !== filterProject) return false;
    return true;
  });

  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">משימות</h1>
          <p className="text-gray-500 text-sm mt-1">
            {openCount > 0 ? `${openCount} משימות פתוחות` : "אין משימות פתוחות"}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          + משימה חדשה
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-5">
              {editing ? "עריכת משימה" : "משימה חדשה"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">תיאור המשימה</label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  placeholder="מה צריך לעשות?"
                  className={inputClass + " resize-none"}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">פרויקט קשור (אופציונלי)</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
                  <option value="">— ללא פרויקט —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">תאריך סיום רצוי (אופציונלי)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 text-gray-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "שומר..." : "שמור"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-800"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(["all", "open", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                filterStatus === s
                  ? "bg-amber-500 text-gray-900 font-medium"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              }`}
            >
              {s === "all" ? "הכל" : s === "open" ? "פתוחות" : "הושלמו"}
            </button>
          ))}
        </div>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
        >
          <option value="">כל הפרויקטים</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">
          <p>אין משימות {filterStatus === "open" ? "פתוחות" : filterStatus === "done" ? "שהושלמו" : ""}</p>
          {filterStatus !== "done" && (
            <button onClick={openNew} className="text-amber-400 underline text-sm mt-2">
              הוסף משימה ראשונה
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isDone = task.status === "done";
            const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue = dueDateObj && dueDateObj < today && !isDone;

            return (
              <div
                key={task.id}
                className={`bg-gray-900 rounded-xl border transition-colors ${
                  isDone ? "border-gray-800 opacity-60" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-600 hover:border-amber-500"
                    }`}
                  >
                    {isDone && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-relaxed ${isDone ? "line-through text-gray-500" : "text-gray-100"}`}>
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {task.project && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                          {task.project.name}
                        </span>
                      )}
                      {dueDateObj && (
                        <span className={`text-xs ${isOverdue ? "text-red-400" : "text-gray-500"}`}>
                          {isOverdue ? "⚠ " : ""}עד {dueDateObj.toLocaleDateString("he-IL")}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        נוצר {new Date(task.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={() => openEdit(task)}
                      className="text-gray-400 hover:text-gray-100 text-xs transition-colors"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-500 hover:text-red-400 text-xs transition-colors"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
