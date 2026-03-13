import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Deletes ALL time entries and phases (projects + employees are kept).
// After running this, re-import from Clockify to get fresh data.
// Visit /api/admin/clear-entries once in the browser to run it.
export async function GET() {
  const deletedEntries = await prisma.timeEntry.deleteMany({});
  const deletedPhases = await prisma.phase.deleteMany({});

  return NextResponse.json({
    success: true,
    message: `נמחקו ${deletedEntries.count} רשומות שעות ו-${deletedPhases.count} שלבים. פרויקטים ועובדים נשמרו. ניתן לייבא מחדש.`,
    deletedEntries: deletedEntries.count,
    deletedPhases: deletedPhases.count,
  });
}
