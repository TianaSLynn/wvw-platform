import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

// Returns the current user's onboarding workflows (as the subject) plus any
// workflows where the user has steps assigned to them (delegation).
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // Workflows where user IS the subject
    const myWorkflows = await db.onboardingWorkflow.findMany({
      where: {
        orgId: user.orgId,
        status: { not: "CANCELLED" },
        OR: [
          { employee: { email: { equals: user.email, mode: "insensitive" } } },
          { studentEmail: { equals: user.email, mode: "insensitive" } },
        ],
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
        steps: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { startDate: "desc" },
    });

    // Workflows where user has steps ASSIGNED to them (delegation)
    const delegatedWorkflows = await db.onboardingWorkflow.findMany({
      where: {
        orgId: user.orgId,
        status: { not: "CANCELLED" },
        steps: { some: { assignedToId: user.id, status: { not: "COMPLETED" } } },
        // Exclude workflows already in myWorkflows
        NOT: {
          OR: [
            { employee: { email: { equals: user.email, mode: "insensitive" } } },
            { studentEmail: { equals: user.email, mode: "insensitive" } },
          ],
        },
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
        steps: {
          where: { assignedToId: user.id },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return ok({ myWorkflows, delegatedWorkflows });
  } catch (e) { return serverError(e); }
}
