import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hmsToDecimal } from "@/lib/timeFormat";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { employeeId, phaseId, date, hours, description } = await req.json();
  const hoursDecimal = hmsToDecimal(hours);
  if (!employeeId || !phaseId || !date || hoursDecimal === null || hoursDecimal <= 0 || !description?.trim()) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }
  const entry = await prisma.timeEntry.update({
    where: { id: Number(id) },
    data: {
      employeeId: Number(employeeId),
      phaseId: Number(phaseId),
      date: new Date(date),
      hours: hoursDecimal,
      description: description.trim(),
    },
    include: { employee: true, phase: { include: { project: true } } },
  });
  return NextResponse.json(entry);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.timeEntry.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
