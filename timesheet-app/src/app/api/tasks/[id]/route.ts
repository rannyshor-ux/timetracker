import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, projectId, dueDate, status } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "תיאור המשימה הוא שדה חובה" }, { status: 400 });
  }
  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      title: title.trim(),
      projectId: projectId ? Number(projectId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status ?? "open",
    },
    include: { project: { select: { id: true, name: true } } },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
