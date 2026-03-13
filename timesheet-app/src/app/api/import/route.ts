import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// Parse a date value — handles JS Date objects, Excel serial numbers, or string formats
function parseDate(raw: unknown): Date {
  if (!raw) return new Date();
  // JS Date object (when cellDates: true)
  if (raw instanceof Date) {
    const iso = raw.toISOString().split("T")[0];
    return new Date(iso + "T12:00:00.000Z");
  }
  // Excel serial number (e.g. 45925)
  if (typeof raw === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + raw * 24 * 60 * 60 * 1000);
    const iso = date.toISOString().split("T")[0];
    return new Date(iso + "T12:00:00.000Z");
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str.substring(0, 10) + "T12:00:00.000Z");
  }
  const parts = str.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`);
  }
  return new Date(str);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "לא נשלח קובץ" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "הקובץ ריק" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let newProjects = 0;
    let newEmployees = 0;
    let newPhases = 0;

    for (const row of rows) {
      const str = (v: unknown) => String(v ?? "").trim();
      // Extract fields — handle both English and possible Hebrew column names
      const projectName = str(row["Project"] || row["פרויקט"]);
      const clientName = str(row["Client"] || row["לקוח"]);
      const userName = str(row["User"] || row["משתמש"]);
      const tags = str(row["Tags"] || row["תגיות"]);
      const dateRaw = row["Start Date"] || row["תאריך התחלה"];
      const hoursRaw = row["Duration (decimal)"] || row["משך (עשרוני)"] || "0";
      const description = str(row["Description"] || row["תיאור"]);

      // Skip header-like or empty rows
      if (!projectName || !dateRaw) { skipped++; continue; }

      const hours = parseFloat(String(hoursRaw));
      if (isNaN(hours) || hours <= 0) { skipped++; continue; }

      const date = parseDate(dateRaw);
      const phaseName = tags || "כללי";

      // Upsert Employee
      let employee = await prisma.employee.findFirst({ where: { name: userName || "לא ידוע" } });
      if (!employee) {
        employee = await prisma.employee.create({ data: { name: userName || "לא ידוע" } });
        newEmployees++;
      }

      // Upsert Project
      let project = await (prisma.project as any).findFirst({ where: { name: projectName } });
      if (!project) {
        project = await (prisma.project as any).create({
          data: { name: projectName, client: clientName || null, status: "active" },
        });
        newProjects++;
      }

      // Upsert Phase (by name within project)
      let phase = await prisma.phase.findFirst({
        where: { projectId: project.id, name: phaseName },
      });
      if (!phase) {
        const maxOrder = await prisma.phase.count({ where: { projectId: project.id } });
        phase = await prisma.phase.create({
          data: { projectId: project.id, name: phaseName, order: maxOrder },
        });
        newPhases++;
      }

      // Check for duplicate entry
      const existing = await prisma.timeEntry.findFirst({
        where: {
          employeeId: employee.id,
          phaseId: phase.id,
          date: date,
          hours: hours,
        },
      });
      if (existing) { skipped++; continue; }

      // Create TimeEntry
      await prisma.timeEntry.create({
        data: {
          employeeId: employee.id,
          phaseId: phase.id,
          date,
          hours,
          description: description || "—",
        },
      });
      imported++;
    }

    return NextResponse.json({ imported, skipped, newProjects, newEmployees, newPhases });
  } catch (err: unknown) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה בייבוא" },
      { status: 500 }
    );
  }
}
