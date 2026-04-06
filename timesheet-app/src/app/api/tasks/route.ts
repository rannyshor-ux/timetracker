import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, projectId, assigneeId, dueDate } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "תיאור המשימה הוא שדה חובה" }, { status: 400 });
  }
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      projectId: projectId ? Number(projectId) : null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}
