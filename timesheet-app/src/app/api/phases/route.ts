import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const phases = await prisma.phase.findMany({
    where: { projectId: Number(projectId) },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(phases);
}

export async function POST(req: Request) {
  const { projectId, name } = await req.json();
  if (!projectId || !name?.trim()) {
    return NextResponse.json({ error: "projectId ו-name הם שדות חובה" }, { status: 400 });
  }
  const lastPhase = await prisma.phase.findFirst({
    where: { projectId: Number(projectId) },
    orderBy: { order: "desc" },
  });
  const phase = await prisma.phase.create({
    data: {
      projectId: Number(projectId),
      name: name.trim(),
      order: (lastPhase?.order ?? 0) + 1,
    },
  });
  return NextResponse.json(phase, { status: 201 });
}
