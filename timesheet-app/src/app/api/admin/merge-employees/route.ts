import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time utility: merges "לא ידוע" into "רני שור"
// Visit /api/admin/merge-employees once in the browser to run it.
export async function GET() {
  const source = await prisma.employee.findFirst({ where: { name: "לא ידוע" } });
  const target = await prisma.employee.findFirst({ where: { name: "רני שור" } });

  if (!source) return NextResponse.json({ message: 'העובד "לא ידוע" לא נמצא — אין מה למזג.' });
  if (!target) return NextResponse.json({ error: 'העובד "רני שור" לא נמצא.' }, { status: 404 });

  const updated = await prisma.timeEntry.updateMany({
    where: { employeeId: source.id },
    data: { employeeId: target.id },
  });

  await prisma.employee.delete({ where: { id: source.id } });

  return NextResponse.json({
    success: true,
    message: `הועברו ${updated.count} רשומות שעות מ"לא ידוע" ל"רני שור". העובד "לא ידוע" נמחק.`,
    movedEntries: updated.count,
  });
}
