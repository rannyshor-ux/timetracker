"use client";

import { useEffect, useState } from "react";

type Project = { id: number; name: string };
type Employee = { id: number; name: string };
type TaskStatus = "not_started" | "in_progress" | "done" | "blocked";
type TaskPriority = "urgent" | "important" | "to_handle";
type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  createdAt: string;
  dueDate: string | null;
  project: { id: number; name: string } | null;
  assignee: { id: number; name: string } | null;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; card: string; select: string }> = {
  not_started: {
    label: "לא התחילה",
    card: "border-gray-800 hover:border-gray-700",
    select: "bg-gray-700 text-gray-300",
  },
  in_progress: {
    label: "בטיפול",
    card: "border-blue-800/50 bg-blue-950/10",
    select: "bg-blue-900/60 text-blue-300",
  },
  done: {
    label: "הושלמה",
    card: "border-emerald-800/50 bg-emerald-950/20",
    select: "bg-emerald-900/60 text-emerald-400",
  },
  blocked: {
    label: "חסומה",
    card: "border-red-800/50",
    select: "bg-red-900/60 text-red-400",
  },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; pill: string }> = {
  to_handle: { label: "לטיפול",  pill: "bg-gray-700 text-gray-300" },
  important:  { label: "חשוב",   pill: "bg-gray-700 text-gray-300" },
  urgent:     { label: "דחוף",   pill: "bg-gray-700 text-gray-300" },
};

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";

const optionClass = "bg-gray-800 text-gray-100";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | TaskPriority>("all");
  const [filterProject, setFilterProject] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [t, p, e] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ]);
    setTasks(t);
    setProjects(p);
    setEmployees(e);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setProjectId("");
    setAssigneeId("");
    setDueDate("");
    setPriority("to_handle");
    setError("");
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setProjectId(task.project ? String(task.project.id) : "");
    setAssigneeId(task.assignee ? String(task.assignee.id) : "");
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setPriority(task.priority ?? "to_handle");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { setError("כותרת המשימה היא שדה חובה"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PUT" : "POST";
      const body = {
        title,
        description: description || null,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        status: editing?.status ?? "not_started",
        priority: priority || "to_handle",
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "שגיאה"); }
      closeForm();
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally { setSaving(false); }
  }

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description ?? null,
        projectId: task.project?.id ?? null,
        assigneeId: task.assignee?.id ?? null,
        dueDate: task.dueDate ?? null,
        status: newStatus,
        priority: task.priority ?? "to_handle",
      }),
    });
    load();
  }

  async function handlePriorityChange(task: Task, newPriority: TaskPriority) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description ?? null,
        projectId: task.project?.id ?? null,
        assigneeId: task.assignee?.id ?? null,
        dueDate: task.dueDate ?? null,
        status: task.status,
        priority: newPriority,
      }),
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
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterProject && String(t.project?.id) !== filterProject) return false;
    if (filterAssignee && String(t.assignee?.id) !== filterAssignee) return false;
    return true;
  });

  const activeCount = tasks.filter((t) => t.status === "not_started" || t.status === "in_progress").length;
  const blockedCount = tasks.filter((t) => t.status === "blocked").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">משימות</h1>
          <p className="text-gray-500 text-sm mt-1">
            {urgentCount > 0 && <span className="text-red-400">{urgentCount} דחופות · </span>}
            {blockedCount > 0
              ? `${activeCount} פעילות · ${blockedCount} חסומות`
              : activeCount > 0
              ? `${activeCount} משימות פעילות`
              : "כל המשימות הושלמו"}
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
                <label className="block text-sm font-medium text-gray-400">כותרת *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="כותרת קצרה למשימה"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">תיאור (אופציונלי)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="פרטים נוספים על המשימה..."
                  className={inputClass + " resize-none"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">עדיפות</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "")} className={inputClass}>
                  <option value="to_handle" className={optionClass}>לטיפול</option>
                  <option value="important" className={optionClass}>חשוב</option>
                  <option value="urgent" className={optionClass}>דחוף</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">שיוך לעובד (אופציונלי)</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputClass}>
                  <option value="" className={optionClass}>— ללא שיוך —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className={optionClass}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">פרויקט קשור (אופציונלי)</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
                  <option value="" className={optionClass}>— ללא פרויקט —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className={optionClass}>{p.name}</option>
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
          {(["all", "not_started", "in_progress", "done", "blocked"] as const).map((s) => {
            const labels: Record<string, string> = {
              all: "הכל", not_started: "לא התחילה", in_progress: "בטיפול", done: "הושלמה", blocked: "חסומה",
            };
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-sm transition-colors ${filterStatus === s ? "bg-amber-500 text-gray-900 font-medium" : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"}`}>
                {labels[s]}
              </button>
            );
          })}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(["all", "to_handle", "important", "urgent"] as const).map((p) => {
            const labels: Record<string, string> = { all: "כל עדיפות", to_handle: "לטיפול", important: "חשוב", urgent: "דחוף" };
            return (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 text-sm transition-colors ${filterPriority === p ? "bg-amber-500 text-gray-900 font-medium" : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"}`}>
                {labels[p]}
              </button>
            );
          })}
        </div>

        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500">
          <option value="">כל העובדים</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>

        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500">
          <option value="">כל הפרויקטים</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">
          <p>אין משימות להצגה</p>
          <button onClick={openNew} className="text-amber-400 underline text-sm mt-2">הוסף משימה חדשה</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.not_started;
            const isDone = task.status === "done";
            const p = (task.priority ?? "to_handle") as TaskPriority;
            const pcfg = PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.to_handle;
            const isHighPriority = (p === "urgent" || p === "important") && !isDone;

            const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue = dueDateObj && dueDateObj < today && !isDone;
            const isDueSoon = dueDateObj && dueDateObj <= threeDaysFromNow && dueDateObj >= today && !isDone;

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-colors ${cfg.card} ${
                  isHighPriority ? "bg-amber-950/30 border-amber-700/50" : "bg-gray-900"
                }`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-relaxed ${isDone ? "line-through text-gray-500" : isHighPriority ? "text-amber-100" : "text-gray-100"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className={`text-xs mt-0.5 leading-relaxed ${isDone ? "line-through text-gray-600" : "text-gray-400"}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {task.assignee && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">
                          {task.assignee.name}
                        </span>
                      )}
                      {task.project && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                          {task.project.name}
                        </span>
                      )}
                      {dueDateObj && (
                        <span className={`text-xs ${isOverdue || isDueSoon ? "text-red-400" : "text-gray-500"}`}>
                          {isOverdue ? "⚠ " : ""}עד {dueDateObj.toLocaleDateString("he-IL")}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        נוצר {new Date(task.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>

                  {/* Status selector */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer ${cfg.select}`}
                  >
                    <option value="not_started" className={optionClass}>לא התחילה</option>
                    <option value="in_progress" className={optionClass}>בטיפול</option>
                    <option value="done" className={optionClass}>הושלמה</option>
                    <option value="blocked" className={optionClass}>חסומה</option>
                  </select>

                  {/* Priority selector */}
                  <select
                    value={p}
                    onChange={(e) => handlePriorityChange(task, e.target.value as TaskPriority)}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer ${pcfg.pill}`}
                  >
                    <option value="to_handle" className={optionClass}>לטיפול</option>
                    <option value="important" className={optionClass}>חשוב</option>
                    <option value="urgent" className={optionClass}>דחוף</option>
                  </select>

                  {/* Actions */}
                  <div className="flex gap-3 flex-shrink-0">
                    <button onClick={() => openEdit(task)} className="text-gray-400 hover:text-gray-100 text-xs transition-colors">
                      עריכה
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-400 text-xs transition-colors">
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
