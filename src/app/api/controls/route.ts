import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const controls = await prisma.iSOControl.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json(controls);
}
