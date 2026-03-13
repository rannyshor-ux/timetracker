import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if ("estimatedHours" in body) {
    data.estimatedHours =
      body.estimatedHours === null || body.estimatedHours === "" || body.estimatedHours === undefined
        ? null
        : Number(body.estimatedHours);
  }
  if ("name" in body && typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  const phase = await (prisma.phase as any).update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(phase);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.phase.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
