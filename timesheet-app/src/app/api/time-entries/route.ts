import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const projectId = searchParams.get("projectId");
  const phaseNames = searchParams.get("phaseNames");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(employeeId ? { employeeId: Number(employeeId) } : {}),
      ...(projectId || phaseNames
        ? {
            phase: {
              ...(projectId ? { projectId: Number(projectId) } : {}),
              ...(phaseNames ? { name: { in: phaseNames.split(",") } } : {}),
            },
          }
        : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
    },
    include: {
      employee: true,
      phase: { include: { project: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const { employeeId, phaseId, date, hours, description } = await req.json();
  if (!employeeId || !phaseId || !date || !hours || !description?.trim()) {
    return NextResponse.json({ error: "כל השדות חובה" }, { status: 400 });
  }
  const entry = await prisma.timeEntry.create({
    data: {
      employeeId: Number(employeeId),
      phaseId: Number(phaseId),
      date: new Date(date),
      hours: Number(hours),
      description: description.trim(),
    },
    include: {
      employee: true,
      phase: { include: { project: true } },
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
