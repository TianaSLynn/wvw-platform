/**
 * GET /api/system/health
 * Backend diagnostic endpoint — checks DB connectivity, entity counts, and schema state.
 * Useful for testing, monitoring, and verifying platform health.
 * Requires ADMIN or SUPER_ADMIN role.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return unauthorized();

    const start = Date.now();

    // Run all counts in parallel for speed
    const [
      orgCount,
      userCount,
      clientCount,
      auditCount,
      auditTemplateCount,
      globalTemplateCount,
      findingCount,
      openFindingCount,
      evidenceCount,
      invoiceCount,
      paidInvoiceCount,
      meetingCount,
      messageCount,
      threadCount,
      courseCount,
      employeeCount,
      grantCount,
      jobCount,
      packageCount,
      licenseCount,
      goalCount,
      reportCount,
      activityLogCount,
      integrationCount,
    ] = await Promise.all([
      db.organization.count(),
      db.user.count(),
      db.client.count({ where: { isActive: true, deletedAt: null } }),
      db.audit.count(),
      db.auditTemplate.count(),
      db.auditTemplate.count({ where: { isGlobal: true, isPublished: true } }),
      db.auditFinding.count(),
      db.auditFinding.count({ where: { status: { notIn: ["CLOSED", "REMEDIATED", "ACCEPTED_RISK"] } } }),
      db.evidence.count(),
      db.invoice.count(),
      db.invoice.count({ where: { status: "PAID" } }),
      db.meeting.count(),
      db.message.count(),
      db.messageThread.count(),
      db.course.count({ where: { isActive: true } }),
      db.employee.count(),
      db.grant.count(),
      db.jobPosting.count({ where: { status: "PUBLISHED" } }),
      db.productPackage.count({ where: { isActive: true } }),
      db.packageLicense.count(),
      db.employeeGoal.count({ where: { status: "ACTIVE" } }),
      db.reportSnapshot.count(),
      db.activityLog.count(),
      db.integration.count({ where: { status: "ACTIVE" } }),
    ]);

    // Financial snapshot
    const invoiceTotals = await db.invoice.aggregate({
      _sum: { total: true },
      where: { orgId: user.orgId },
    });
    const paidTotals = await db.invoice.aggregate({
      _sum: { total: true },
      where: { orgId: user.orgId, status: "PAID" },
    });

    // Audit health: open vs. closed
    const auditsByStatus = await db.audit.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { orgId: user.orgId },
    });

    // Findings breakdown
    const findingsBySeverity = await db.auditFinding.groupBy({
      by: ["severity"],
      _count: { _all: true },
      where: { audit: { orgId: user.orgId } },
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await db.activityLog.count({
      where: { orgId: user.orgId, timestamp: { gte: sevenDaysAgo } },
    });

    const elapsed = Date.now() - start;

    return ok({
      status: "healthy",
      timestamp: new Date().toISOString(),
      queryTimeMs: elapsed,
      org: {
        id: user.orgId,
        role: user.role,
      },
      platform: {
        organizations: orgCount,
        users: userCount,
        activeClients: clientCount,
        activeIntegrations: integrationCount,
        activePackages: packageCount,
        packageLicenses: licenseCount,
      },
      audits: {
        total: auditCount,
        templates: auditTemplateCount,
        globalFrameworkTemplates: globalTemplateCount,
        findings: {
          total: findingCount,
          open: openFindingCount,
          bySeverity: findingsBySeverity.reduce((acc, r) => {
            acc[r.severity] = r._count._all;
            return acc;
          }, {} as Record<string, number>),
        },
        byStatus: auditsByStatus.reduce((acc, r) => {
          acc[r.status] = r._count._all;
          return acc;
        }, {} as Record<string, number>),
        evidence: evidenceCount,
      },
      financial: {
        totalInvoices: invoiceCount,
        paidInvoices: paidInvoiceCount,
        totalRevenue: invoiceTotals._sum.total ?? 0,
        collectedRevenue: paidTotals._sum.total ?? 0,
        collectionRate: invoiceTotals._sum.total
          ? Math.round(((paidTotals._sum.total ?? 0) / invoiceTotals._sum.total) * 100)
          : 0,
      },
      operations: {
        meetings: meetingCount,
        messages: messageCount,
        threads: threadCount,
        reports: reportCount,
        recentActivityLast7Days: recentActivity,
      },
      academy: {
        activeCourses: courseCount,
        employees: employeeCount,
        grants: grantCount,
        openJobs: jobCount,
      },
      people: {
        activeGoals: goalCount,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
