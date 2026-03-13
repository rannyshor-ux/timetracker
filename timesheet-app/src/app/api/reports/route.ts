import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      phases: {
        include: {
          timeEntries: {
            include: { employee: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = projects.map((project) => {
    const totalHours = project.phases.reduce(
      (sum, phase) =>
        sum + phase.timeEntries.reduce((s, e) => s + e.hours, 0),
      0
    );
    const phases = project.phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      order: phase.order,
      hours: phase.timeEntries.reduce((s, e) => s + e.hours, 0),
      entriesCount: phase.timeEntries.length,
    }));
    return {
      id: project.id,
      name: project.name,
      client: project.client,
      status: project.status,
      totalHours,
      phases,
    };
  });

  return NextResponse.json(summary);
}
