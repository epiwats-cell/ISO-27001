export interface ISOControl {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  description: string;
  order: number;
  _count?: { documents: number };
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  version: string;
  status: "draft" | "review" | "approved" | "obsolete";
  controlId: string;
  control?: ISOControl;
  uploadedBy: string;
  uploader?: { name: string; email: string };
  tags?: string;
  expiryDate?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  department?: string;
  createdAt: string;
  _count?: { documents: number };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user?: { name: string; email: string };
  documentId?: string;
  document?: { title: string };
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDocuments: number;
  approvedDocuments: number;
  pendingReview: number;
  draftDocuments: number;
  obsoleteDocuments: number;
  totalControls: number;
  controlsWithDocuments: number;
  recentDocuments: Document[];
  documentsByControl: { code: string; nameTh: string; count: number }[];
}
