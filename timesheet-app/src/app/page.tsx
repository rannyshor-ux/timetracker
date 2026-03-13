import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { decimalToHMS } from "@/lib/timeFormat";
import WeeklyHoursCard from "./components/WeeklyHoursCard";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "פעיל",
  completed: "הושלם",
  "on-hold": "בהמתנה",
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-900/50 text-emerald-400",
  completed: "bg-blue-900/50 text-blue-400",
  "on-hold": "bg-amber-900/50 text-amber-400",
};

type PhaseWithEntries = {
  id: number;
  name: string;
  order: number;
  estimatedHours: number | null;
  timeEntries: { hours: number }[];
};

function PhaseProgressBar({ phase }: { phase: PhaseWithEntries }) {
  const actual = phase.timeEntries.reduce((s, e) => s + e.hours, 0);
  const estimated = phase.estimatedHours;

  let pct = 0;
  let barColor = "bg-emerald-500";
  let statusText = "";

  if (estimated && estimated > 0) {
    pct = Math.min((actual / estimated) * 100, 100);
    const ratio = actual / estimated;
    if (ratio >= 1) {
      barColor = "bg-red-500";
      statusText = `חריגה של ${decimalToHMS(actual - estimated)}`;
    } else if (ratio >= 0.8) {
      barColor = "bg-amber-500";
      statusText = `נותרו ${decimalToHMS(estimated - actual)}`;
    } else {
      barColor = "bg-emerald-500";
      statusText = `נותרו ${decimalToHMS(estimated - actual)}`;
    }
  }

  return (
    <div className="bg-gray-800/60 rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-500 truncate">{phase.name}</p>
        <div className="text-xs shrink-0 mr-2">
          <span className="font-semibold text-gray-200">{decimalToHMS(actual)}</span>
          {estimated ? (
            <span className="text-gray-500"> / {decimalToHMS(estimated)}</span>
          ) : (
            <span className="text-gray-600"></span>
          )}
        </div>
      </div>

      {estimated ? (
        <>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {statusText && (
            <p className={`text-xs mt-1 ${pct >= 100 ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-gray-600"}`}>
              {statusText}
            </p>
          )}
        </>
      ) : (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-blue-500/50" style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [projects, employees, recentEntries] = await Promise.all([
    (prisma.project as any).findMany({
      include: {
        phases: {
          include: { timeEntries: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany(),
    prisma.timeEntry.findMany({
      where: {
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const activeProjects = projects.filter((p: any) => p.status === "active");
  const totalHoursWeek = recentEntries.reduce((s: number, e: any) => s + e.hours, 0);
  const totalHoursAll = projects
    .flatMap((p: any) => p.phases.flatMap((ph: any) => ph.timeEntries))
    .reduce((s: number, e: any) => s + e.hours, 0);

  const totalEstimated = projects
    .flatMap((p: any) => p.phases)
    .filter((ph: any) => ph.estimatedHours != null)
    .reduce((s: number, ph: any) => s + (ph.estimatedHours ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">לוח בקרה</h1>
          <p className="text-gray-500 text-sm mt-1">סיכום שעות עבודה לפי פרויקטים</p>
        </div>
        <Link
          href="/log"
          className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          + הזן שעות
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="שעות השבוע" value={decimalToHMS(totalHoursWeek)} unit="" />
        <StatCard label="סה״כ שעות" value={decimalToHMS(totalHoursAll)} unit="" />
        <StatCard label="שעות מתוכננות" value={totalEstimated > 0 ? decimalToHMS(totalEstimated) : "—"} unit="" />
        <StatCard label="פרויקטים פעילים" value={String(activeProjects.length)} unit="" />
      </div>

      {/* Weekly hours per employee */}
      <WeeklyHoursCard employees={employees} />

      {/* Projects */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">פרויקטים — שעות בפועל לעומת תכנון</h2>
          <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-200">
            ניהול פרויקטים ←
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>אין פרויקטים עדיין.</p>
            <Link href="/projects" className="text-amber-400 underline text-sm mt-2 inline-block">
              הוסף פרויקט ראשון
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {projects.map((project: any) => {
              const phases: PhaseWithEntries[] = project.phases;
              const actualHours = phases
                .flatMap((ph) => ph.timeEntries)
                .reduce((s, e) => s + e.hours, 0);
              const estimatedHours = phases
                .filter((ph) => ph.estimatedHours != null)
                .reduce((s, ph) => s + (ph.estimatedHours ?? 0), 0);
              const hasEstimates = phases.some((ph) => ph.estimatedHours != null);

              const overallPct = hasEstimates && estimatedHours > 0
                ? Math.min((actualHours / estimatedHours) * 100, 100)
                : null;
              const overallColor = overallPct == null ? "bg-blue-500/40"
                : overallPct >= 100 ? "bg-red-500"
                : overallPct >= 80 ? "bg-amber-500"
                : "bg-emerald-500";

              return (
                <div key={project.id} className="px-6 py-5">
                  {/* Project header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-100">{project.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[project.status] ?? "bg-gray-800 text-gray-400"}`}>
                          {STATUS_LABEL[project.status] ?? project.status}
                        </span>
                      </div>
                      {project.client && <p className="text-sm text-gray-500 mt-0.5">{project.client}</p>}
                    </div>

                    {/* Overall numbers */}
                    <div className="text-left shrink-0 mr-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-amber-400">{decimalToHMS(actualHours)}</span>
                        {hasEstimates && estimatedHours > 0 && (
                          <span className="text-sm text-gray-500">/ {decimalToHMS(estimatedHours)}</span>
                        )}
                        {(!hasEstimates || estimatedHours === 0) && (
                          <span className="text-xs text-gray-600">סה"כ</span>
                        )}
                      </div>
                      {overallPct !== null && (
                        <p className={`text-xs text-left mt-0.5 ${overallPct >= 100 ? "text-red-400" : overallPct >= 80 ? "text-amber-400" : "text-gray-500"}`}>
                          {overallPct.toFixed(0)}% מסך השעות
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Overall progress bar */}
                  {overallPct !== null && (
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${overallColor}`}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                  )}

                  {/* Phase grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {phases.map((phase) => (
                      <PhaseProgressBar key={phase.id} phase={phase} />
                    ))}
                  </div>

                  {!hasEstimates && (
                    <p className="text-xs text-gray-700 mt-2">
                      <Link href="/projects" className="hover:text-gray-500">
                        הגדר שעות משוערות לשלבים ←
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-100 mt-1">{value}</p>
      {unit && <p className="text-xs text-gray-500 mt-0.5">{unit}</p>}
    </div>
  );
}
