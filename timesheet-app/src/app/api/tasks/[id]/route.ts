import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, description, projectId, assigneeId, dueDate, status, priority, archived } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "כותרת המשימה היא שדה חובה" }, { status: 400 });
  }
  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      projectId: projectId ? Number(projectId) : null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status ?? "not_started",
      priority: priority || null,
      archived: archived ?? false,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
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
