import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PHASES = [
  { name: "התנעה ותכנון ראשוני", estimatedHours: 120 },
  { name: "בקשה להיתר", estimatedHours: 80 },
  { name: "מסמכים למכרז", estimatedHours: 300 },
  { name: "מסמכים לביצוע", estimatedHours: 100 },
  { name: "פיקוח עליון", estimatedHours: 50 },
];

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      phases: { orderBy: { order: "asc" } },
      _count: { select: { phases: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { name, client, description, status } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם פרויקט הוא שדה חובה" }, { status: 400 });
  }
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      client: client?.trim() || null,
      description: description?.trim() || null,
      status: status || "active",
      phases: {
        create: DEFAULT_PHASES.map((phase, i) => ({
          name: phase.name,
          order: i + 1,
          estimatedHours: phase.estimatedHours,
        })),
      },
    },
    include: { phases: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(project, { status: 201 });
}
