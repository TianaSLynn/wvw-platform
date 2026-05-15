/**
 * Onboarding/Offboarding Workflow API
 * Supports Employee, Client, and Student entity types.
 * Steps use sequential blocking — a step stays BLOCKED until its prerequisite is COMPLETED.
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { createOnboardingWorkflow } from "@/lib/onboarding-service";
import { z } from "zod";

const createSchema = z.object({
  entityType:   z.enum(["EMPLOYEE", "CLIENT", "STUDENT"]).default("EMPLOYEE"),
  employeeId:   z.string().optional(),
  clientId:     z.string().optional(),
  studentName:  z.string().optional(),
  studentEmail: z.string().optional(),
  cohortId:     z.string().optional(),
  type:         z.enum(["ONBOARDING", "OFFBOARDING"]).default("ONBOARDING"),
  targetDate:   z.string().nullish(),
  notes:        z.string().nullish(),
  useTemplate:  z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type       = searchParams.get("type")       ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;

    const workflows = await db.onboardingWorkflow.findMany({
      where: {
        orgId: user.orgId,
        ...(type       ? { type: type as "ONBOARDING" | "OFFBOARDING" } : {}),
        ...(entityType ? { entityType } : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true, employmentStatus: true } },
        client:   { select: { id: true, name: true, industry: true } },
        steps:    { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(workflows);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { entityType, employeeId, clientId, studentName, studentEmail, cohortId, type, targetDate, notes, useTemplate } = parsed.data;

    // Validate entity exists
    if (entityType === "EMPLOYEE") {
      if (!employeeId) return badRequest("employeeId is required for EMPLOYEE onboarding");
      const emp = await db.employee.findFirst({ where: { id: employeeId, orgId: user.orgId } });
      if (!emp) return badRequest("Employee not found");
    }
    if (entityType === "CLIENT") {
      if (!clientId) return badRequest("clientId is required for CLIENT onboarding");
      const cl = await db.client.findFirst({ where: { id: clientId, orgId: user.orgId } });
      if (!cl) return badRequest("Client not found");
    }

    const workflow = await createOnboardingWorkflow({
      orgId: user.orgId,
      entityType,
      employeeId,
      clientId,
      studentName,
      studentEmail,
      cohortId,
      type,
      targetDate: targetDate ? new Date(targetDate) : null,
      notes,
      template: useTemplate ? undefined : [],
    });

    return created(workflow);
  } catch (e) { return serverError(e); }
}
