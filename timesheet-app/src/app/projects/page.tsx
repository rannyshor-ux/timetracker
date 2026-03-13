"use client";

import { useEffect, useState } from "react";

type Phase = { id: number; name: string; order: number; estimatedHours: number | null };
type Project = {
  id: number; name: string; client: string | null; description: string | null;
  status: string; createdAt: string; phases: Phase[];
};

const STATUS_LABEL: Record<string, string> = { active: "פעיל", completed: "הושלם", "on-hold": "בהמתנה" };
const STATUS_OPTIONS = [
  { value: "active", label: "פעיל" },
  { value: "completed", label: "הושלם" },
  { value: "on-hold", label: "בהמתנה" },
];
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-900/50 text-emerald-400",
  completed: "bg-blue-900/50 text-blue-400",
  "on-hold": "bg-amber-900/50 text-amber-400",
};

const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [addingPhase, setAddingPhase] = useState(false);
  // estimated hours editing: phaseId -> value string
  const [estEditing, setEstEditing] = useState<Record<number, string>>({});
  const [estSaving, setEstSaving] = useState<number | null>(null);
  // phase name editing: phaseId -> value string
  const [nameEditing, setNameEditing] = useState<Record<number, string>>({});
  const [nameSaving, setNameSaving] = useState<number | null>(null);

  async function load() {
    const data = await fetch("/api/projects").then((r) => r.json());
    setProjects(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setName(""); setClient(""); setDescription(""); setStatus("active"); setError(""); setShowForm(true); }
  function openEdit(proj: Project) { setEditing(proj); setName(proj.name); setClient(proj.client ?? ""); setDescription(proj.description ?? ""); setStatus(proj.status); setError(""); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("שם פרויקט הוא שדה חובה"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), client: client.trim(), description: description.trim(), status }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "שגיאה"); }
      closeForm(); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק פרויקט זה? כל השלבים ורישומי השעות יימחקו גם כן.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddPhase(projectId: number) {
    if (!newPhaseName.trim()) return;
    setAddingPhase(true);
    await fetch("/api/phases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, name: newPhaseName.trim() }) });
    setNewPhaseName(""); setAddingPhase(false); load();
  }

  async function handleDeletePhase(phaseId: number) {
    if (!confirm("למחוק שלב זה?")) return;
    await fetch(`/api/phases/${phaseId}`, { method: "DELETE" });
    load();
  }

  async function handleSaveEstimated(phaseId: number) {
    setEstSaving(phaseId);
    const val = estEditing[phaseId];
    await fetch(`/api/phases/${phaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimatedHours: val === "" ? null : val }),
    });
    setEstSaving(null);
    setEstEditing((prev) => { const n = { ...prev }; delete n[phaseId]; return n; });
    load();
  }

  function initEstEdit(phase: Phase) {
    setEstEditing((prev) => ({
      ...prev,
      [phase.id]: phase.estimatedHours != null ? String(phase.estimatedHours) : "",
    }));
  }

  async function handleSaveName(phaseId: number) {
    const val = nameEditing[phaseId];
    if (!val?.trim()) return;
    setNameSaving(phaseId);
    await fetch(`/api/phases/${phaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: val.trim() }),
    });
    setNameSaving(null);
    setNameEditing((prev) => { const n = { ...prev }; delete n[phaseId]; return n; });
    load();
  }

  function initNameEdit(phase: Phase) {
    setNameEditing((prev) => ({ ...prev, [phase.id]: phase.name }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">פרויקטים</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול פרויקטים, שלבים ושעות משוערות</p>
        </div>
        <button onClick={openNew} className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
          + פרויקט חדש
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">{editing ? "עריכת פרויקט" : "פרויקט חדש"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">שם פרויקט *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="וילה כרמל" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">לקוח</label>
                <input type="text" value={client} onChange={(e) => setClient(e.target.value)} className={inputClass} placeholder="משפחת כהן" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">תיאור</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="בית פרטי 350 מ״ר, תל אביב" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">סטטוס</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {!editing && (
                <p className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
                  5 שלבי ברירת מחדל יתווספו: התנעה ותכנון ראשוני, בקשה להיתר, מסמכים למכרז, מסמכים לביצוע, פיקוח עליון
                </p>
              )}
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
      <div className="space-y-3">
        {loading ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">טוען...</div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">
            <p>אין פרויקטים עדיין.</p>
            <button onClick={openNew} className="text-amber-400 underline text-sm mt-2">הוסף פרויקט ראשון</button>
          </div>
        ) : (
          projects.map((proj) => {
            const totalEst = proj.phases.reduce((sum, p) => sum + (p.estimatedHours ?? 0), 0);
            const hasEst = proj.phases.some((p) => p.estimatedHours != null);
            return (
            <div key={proj.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-100">{proj.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[proj.status] ?? "bg-gray-800 text-gray-400"}`}>
                      {STATUS_LABEL[proj.status] ?? proj.status}
                    </span>
                  </div>
                  {proj.client && <p className="text-sm text-gray-500 mt-0.5">{proj.client}</p>}
                  {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasEst && (
                    <span className="text-xs text-amber-400 font-medium px-3 py-1.5">
                      סה״כ {totalEst} שע׳
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id)}
                    className="text-xs text-gray-500 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-800"
                  >
                    {expandedId === proj.id ? "סגור" : `שלבים (${proj.phases.length})`}
                  </button>
                  <button onClick={() => openEdit(proj)} className="text-sm text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-800">
                    עריכה
                  </button>
                  <button onClick={() => handleDelete(proj.id)} className="text-sm text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/30">
                    מחיקה
                  </button>
                </div>
              </div>

              {expandedId === proj.id && (
                <div className="border-t border-gray-800 bg-gray-800/40 px-6 py-4 space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs text-gray-500 font-medium uppercase tracking-wide px-1">
                    <span>שם השלב</span>
                    <span className="w-28 text-center">שעות משוערות</span>
                    <span className="w-10"></span>
                  </div>

                  {/* Phase rows */}
                  {proj.phases.map((phase) => {
                    const isEditingEst = phase.id in estEditing;
                    const isEditingName = phase.id in nameEditing;
                    return (
                      <div key={phase.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center bg-gray-800 rounded-lg px-4 py-2.5">
                        {/* Phase name — click to edit */}
                        {isEditingName ? (
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={nameEditing[phase.id]}
                              onChange={(e) => setNameEditing((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(phase.id); if (e.key === "Escape") setNameEditing((prev) => { const n = { ...prev }; delete n[phase.id]; return n; }); }}
                              autoFocus
                              className="flex-1 bg-gray-700 border border-amber-500 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none"
                            />
                            <button onClick={() => handleSaveName(phase.id)} disabled={nameSaving === phase.id} className="text-amber-400 hover:text-amber-300 text-xs px-1">✓</button>
                            <button onClick={() => setNameEditing((prev) => { const n = { ...prev }; delete n[phase.id]; return n; })} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => initNameEdit(phase)} className="text-sm text-gray-300 text-right hover:text-amber-400 transition-colors truncate">
                            {phase.name}
                          </button>
                        )}

                        {/* Estimated hours cell */}
                        <div className="w-28">
                          {isEditingEst ? (
                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={estEditing[phase.id]}
                                onChange={(e) => setEstEditing((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveEstimated(phase.id); if (e.key === "Escape") setEstEditing((prev) => { const n = { ...prev }; delete n[phase.id]; return n; }); }}
                                autoFocus
                                className="w-16 bg-gray-700 border border-amber-500 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none"
                                placeholder="0"
                              />
                              <button
                                onClick={() => handleSaveEstimated(phase.id)}
                                disabled={estSaving === phase.id}
                                className="text-amber-400 hover:text-amber-300 text-xs px-1"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => initEstEdit(phase)}
                              className="text-xs text-center w-full"
                            >
                              {phase.estimatedHours != null ? (
                                <span className="text-amber-400 font-medium">{phase.estimatedHours} שע'</span>
                              ) : (
                                <span className="text-gray-600 hover:text-gray-400">+ הגדר</span>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Delete */}
                        <button onClick={() => handleDeletePhase(phase.id)} className="w-10 text-red-500 hover:text-red-400 text-xs text-center">
                          מחק
                        </button>
                      </div>
                    );
                  })}

                  {/* Total estimated hours */}
                  {hasEst && (
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border-t border-gray-700 pt-2 px-1">
                      <span className="text-xs text-gray-500 font-medium">סה״כ שעות משוערות</span>
                      <span className="w-28 text-center text-sm font-semibold text-amber-400">{totalEst} שע׳</span>
                      <span className="w-10"></span>
                    </div>
                  )}

                  {/* Add phase */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text" value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPhase(proj.id)}
                      placeholder="הוסף שלב חדש..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      onClick={() => handleAddPhase(proj.id)}
                      disabled={addingPhase || !newPhaseName.trim()}
                      className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
                    >
                      הוסף
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
