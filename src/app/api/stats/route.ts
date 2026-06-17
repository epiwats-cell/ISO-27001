import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalDocuments,
    approvedDocuments,
    pendingReview,
    draftDocuments,
    obsoleteDocuments,
    totalControls,
    recentDocuments,
    documentsByControl,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { status: "approved" } }),
    prisma.document.count({ where: { status: "review" } }),
    prisma.document.count({ where: { status: "draft" } }),
    prisma.document.count({ where: { status: "obsolete" } }),
    prisma.iSOControl.count(),
    prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { control: true, uploader: { select: { name: true } } },
    }),
    prisma.iSOControl.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { order: "asc" },
    }),
  ]);

  const controlsWithDocuments = documentsByControl.filter(
    (c) => c._count.documents > 0
  ).length;

  return NextResponse.json({
    totalDocuments,
    approvedDocuments,
    pendingReview,
    draftDocuments,
    obsoleteDocuments,
    totalControls,
    controlsWithDocuments,
    recentDocuments,
    documentsByControl: documentsByControl.map((c) => ({
      code: c.code,
      nameTh: c.nameTh,
      count: c._count.documents,
    })),
  });
}
