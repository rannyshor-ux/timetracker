import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";

  const tasks = await prisma.task.findMany({
    where: { archived },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, description, projectId, assigneeId, dueDate, priority } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "כותרת המשימה היא שדה חובה" }, { status: 400 });
  }
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      projectId: projectId ? Number(projectId) : null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || null,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}
