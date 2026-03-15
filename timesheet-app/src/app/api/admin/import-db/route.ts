import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const importSecret = process.env.IMPORT_SECRET;
  if (!importSecret) {
    return NextResponse.json({ error: "Import not enabled" }, { status: 403 });
  }

  const providedSecret = request.headers.get("x-import-secret");
  if (providedSecret !== importSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const { employees, projects, phases, timeEntries } = await request.json();

  // Clear existing data in correct order (FK constraints)
  await prisma.timeEntry.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employee.deleteMany();

  // Insert employees
  for (const emp of employees) {
    await prisma.employee.create({ data: { id: emp.id, name: emp.name, role: emp.role, createdAt: new Date(emp.createdAt) } });
  }

  // Insert projects
  for (const proj of projects) {
    await prisma.project.create({ data: { id: proj.id, name: proj.name, client: proj.client, description: proj.description, status: proj.status, createdAt: new Date(proj.createdAt) } });
  }

  // Insert phases
  for (const phase of phases) {
    await prisma.phase.create({ data: { id: phase.id, projectId: phase.projectId, name: phase.name, order: phase.order, estimatedHours: phase.estimatedHours } });
  }

  // Insert time entries
  for (const entry of timeEntries) {
    await prisma.timeEntry.create({ data: { id: entry.id, employeeId: entry.employeeId, phaseId: entry.phaseId, date: new Date(entry.date), hours: entry.hours, description: entry.description, createdAt: new Date(entry.createdAt) } });
  }

  return NextResponse.json({
    ok: true,
    imported: { employees: employees.length, projects: projects.length, phases: phases.length, timeEntries: timeEntries.length },
  });
}
