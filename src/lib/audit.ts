import { prisma } from "./db";

export async function createAuditLog({
  action,
  entityType,
  entityId,
  userId,
  documentId,
  details,
}: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  documentId?: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      documentId,
      details,
    },
  });
}
