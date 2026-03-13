import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time utility: renames all phases named "תכנון ראשוני" to "התנעה ותכנון ראשוני"
// Visit /api/admin/rename-phase once in the browser to run it.
export async function GET() {
  const result = await prisma.phase.updateMany({
    where: { name: "תכנון ראשוני" },
    data: { name: "התנעה ותכנון ראשוני" },
  });

  if (result.count === 0) {
    return NextResponse.json({ message: 'לא נמצאו שלבים בשם "תכנון ראשוני".' });
  }

  return NextResponse.json({
    success: true,
    message: `עודכנו ${result.count} שלבים מ"תכנון ראשוני" ל"התנעה ותכנון ראשוני".`,
    updated: result.count,
  });
}
