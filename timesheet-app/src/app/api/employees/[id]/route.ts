import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, role } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם הוא שדה חובה" }, { status: 400 });
  }
  const employee = await prisma.employee.update({
    where: { id: Number(id) },
    data: { name: name.trim(), role: role?.trim() || null },
  });
  return NextResponse.json(employee);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.employee.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
