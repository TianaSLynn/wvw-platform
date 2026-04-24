import { db } from "@/lib/db";

interface LogActivityParams {
  orgId: string;
  userId?: string;
  action: string;           // e.g. "audit.finding.created"
  entityType: string;       // e.g. "AuditFinding"
  entityId: string;
  entityLabel?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  clientId?: string;
  projectId?: string;
  auditId?: string;
  ipAddress?: string;
}

/**
 * Append-only activity log entry — never updated, only inserted.
 * Used as the immutable audit trail for all critical actions.
 */
export async function logActivity(params: LogActivityParams) {
  return db.activityLog.create({
    data: {
      orgId:       params.orgId,
      userId:      params.userId,
      action:      params.action,
      entityType:  params.entityType,
      entityId:    params.entityId,
      entityLabel: params.entityLabel,
      beforeData:  params.beforeData as never,
      afterData:   params.afterData as never,
      metadata:    params.metadata as never,
      clientId:    params.clientId,
      projectId:   params.projectId,
      auditId:     params.auditId,
      ipAddress:   params.ipAddress,
    },
  });
}
