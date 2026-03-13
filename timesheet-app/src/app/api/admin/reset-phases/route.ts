import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PHASES = [
  "התנעה ותכנון ראשוני",
  "בקשה להיתר",
  "מסמכים למכרז",
  "מסמכים לביצוע",
  "פיקוח עליון",
];

// Adds any missing default phases to ALL existing projects.
// Does NOT delete existing phases or their time entries.
// Visit /api/admin/reset-phases once in the browser to run it.
export async function GET() {
  const projects = await prisma.project.findMany({
    include: { phases: true },
  });

  let added = 0;

  for (const project of projects) {
    const existingNames = new Set(project.phases.map((p) => p.name));
    const maxOrder = project.phases.length;

    for (let i = 0; i < DEFAULT_PHASES.length; i++) {
      const phaseName = DEFAULT_PHASES[i];
      if (!existingNames.has(phaseName)) {
        await prisma.phase.create({
          data: {
            projectId: project.id,
            name: phaseName,
            order: maxOrder + i + 1,
          },
        });
        added++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `נוספו ${added} שלבים חסרים ב-${projects.length} פרויקטים.`,
    projectsProcessed: projects.length,
    phasesAdded: added,
  });
}
