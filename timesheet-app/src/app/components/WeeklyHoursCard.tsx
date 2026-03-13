"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decimalToHMS } from "@/lib/timeFormat";

type Employee = { id: number; name: string };
type WeekEntry = {
  hours: number;
  phase: { project: { id: number; name: string } };
};

function getWeekBounds() {
  const today = new Date();
  const day = today.getDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  return {
    from: monday.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

export default function WeeklyHoursCard({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [entries, setEntries] = useState<WeekEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("weeklyCard_employeeId");
    if (saved) setEmployeeId(saved);
  }, []);

  useEffect(() => {
    if (!employeeId) { setEntries([]); return; }
    localStorage.setItem("weeklyCard_employeeId", employeeId);
    setLoading(true);
    const { from, to } = getWeekBounds();
    fetch(`/api/time-entries?employeeId=${employeeId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId]);

  const byProject = entries.reduce((acc, entry) => {
    const { id, name } = entry.phase.project;
    if (!acc[id]) acc[id] = { name, hours: 0 };
    acc[id].hours += entry.hours;
    return acc;
  }, {} as Record<number, { name: string; hours: number }>);

  const projects = Object.values(byProject).sort((a, b) => b.hours - a.hours);
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-100">שעות שלי השבוע</h2>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">— בחר עובד —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {!employeeId ? (
        <div className="px-6 py-8 text-center text-gray-500 text-sm">בחר עובד לצפייה בשעות השבוע</div>
      ) : loading ? (
        <div className="px-6 py-8 text-center text-gray-500 text-sm">טוען...</div>
      ) : entries.length === 0 ? (
        <div className="px-6 py-8 text-center space-y-3">
          <p className="text-gray-500 text-sm">לא דווחו שעות השבוע</p>
          <Link
            href={`/log?date=${todayStr}`}
            className="inline-block bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400"
          >
            הזן שעות עכשיו
          </Link>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">סה״כ השבוע</span>
            <span className="text-xl font-bold text-amber-400">{decimalToHMS(totalHours)}</span>
          </div>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.name} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-300 truncate">{proj.name}</span>
                <span className="text-sm font-semibold text-amber-400 shrink-0 mr-2">{decimalToHMS(proj.hours)}</span>
              </div>
            ))}
          </div>
          <Link
            href={`/log?date=${todayStr}`}
            className="block text-center text-xs text-gray-500 hover:text-amber-400 pt-1"
          >
            + הזן שעות נוספות
          </Link>
        </div>
      )}
    </div>
  );
}
