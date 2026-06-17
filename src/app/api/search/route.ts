import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) return NextResponse.json({ documents: [] });

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { fileName: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      control: true,
      uploader: { select: { name: true } },
    },
  });

  return NextResponse.json({ documents, query: q });
}
