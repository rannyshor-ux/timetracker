import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const { name, role } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם הוא שדה חובה" }, { status: 400 });
  }
  const employee = await prisma.employee.create({
    data: { name: name.trim(), role: role?.trim() || null },
  });
  return NextResponse.json(employee, { status: 201 });
}
