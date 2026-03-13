import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, client, description, status } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם פרויקט הוא שדה חובה" }, { status: 400 });
  }
  const project = await prisma.project.update({
    where: { id: Number(id) },
    data: {
      name: name.trim(),
      client: client?.trim() || null,
      description: description?.trim() || null,
      status: status || "active",
    },
    include: { phases: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
