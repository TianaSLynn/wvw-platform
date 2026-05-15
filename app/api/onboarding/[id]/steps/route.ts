/**
 * Onboarding step management — update status, add custom steps.
 * When a step is COMPLETED, any steps blocked by it are automatically unlocked (→ PENDING).
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const STEP_STATUSES = ["PENDING","IN_PROGRESS","COMPLETED","SKIPPED","BLOCKED"] as const;
const STEP_CATEGORIES = ["HR","IT","TRAINING","CULTURE","LEGAL","INTRO","GENERAL"] as const;

const updateStepSchema = z.object({
  stepId:            z.string(),
  status:            z.enum(STEP_STATUSES).optional(),
  notes:             z.string().nullable().optional(),
  dueDate:           z.string().nullable().optional(),
  assignedToId:      z.string().nullable().optional(),
  documentCollected: z.boolean().optional(),
  documentNote:      z.string().nullable().optional(),
});

const addStepSchema = z.object({
  title:        z.string().min(1),
  description:  z.string().optional(),
  category:     z.enum(STEP_CATEGORIES).default("GENERAL"),
  dueDate:      z.string().optional(),
  assignedToId: z.string().optional(),
  sortOrder:    z.number().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: workflowId } = await params;

    const workflow = await db.onboardingWorkflow.findFirst({ where: { id: workflowId, orgId: user.orgId } });
    if (!workflow) return notFound("Workflow");

    const body = await req.json();
    const parsed = updateStepSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { stepId, status, notes, dueDate, assignedToId, documentCollected, documentNote } = parsed.data;

    // Prevent completing a blocked step
    if (status === "COMPLETED" || status === "IN_PROGRESS") {
      const current = await db.onboardingStep.findUnique({
        where: { id: stepId },
        include: { blockedByStep: true },
      });
      if (current?.blockedByStep && current.blockedByStep.status !== "COMPLETED" && current.blockedByStep.status !== "SKIPPED") {
        return badRequest(`This step is blocked by "${current.blockedByStep.title}" — complete that step first.`);
      }
    }

    const step = await db.onboardingStep.update({
      where: { id: stepId },
      data: {
        ...(status !== undefined ? {
          status,
          completedAt: status === "COMPLETED" ? new Date() : null,
        } : {}),
        ...(notes              !== undefined ? { notes }                               : {}),
        ...(assignedToId       !== undefined ? { assignedToId: assignedToId || null }  : {}),
        ...(dueDate            !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(documentCollected  !== undefined ? { documentCollected }                   : {}),
        ...(documentNote       !== undefined ? { documentNote: documentNote || null }  : {}),
      },
    });

    // When a step is completed or skipped, unlock steps that were blocked by it
    if (status === "COMPLETED" || status === "SKIPPED") {
      await db.onboardingStep.updateMany({
        where: { workflowId, blockedByStepId: stepId, status: "BLOCKED" },
        data:  { status: "PENDING" },
      });

      // Auto-complete workflow if all steps done
      const allSteps = await db.onboardingStep.findMany({ where: { workflowId } });
      const allDone = allSteps.every(s => s.status === "COMPLETED" || s.status === "SKIPPED");
      if (allDone) {
        await db.onboardingWorkflow.update({
          where: { id: workflowId },
          data:  { status: "COMPLETED", completedAt: new Date() },
        });
      }
    }

    return ok(step);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: workflowId } = await params;

    const workflow = await db.onboardingWorkflow.findFirst({ where: { id: workflowId, orgId: user.orgId } });
    if (!workflow) return notFound("Workflow");

    const body = await req.json();
    const parsed = addStepSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { dueDate, assignedToId, ...rest } = parsed.data;

    const lastStep = await db.onboardingStep.findFirst({
      where:   { workflowId },
      orderBy: { sortOrder: "desc" },
    });

    const step = await db.onboardingStep.create({
      data: {
        ...rest,
        workflowId,
        sortOrder:    rest.sortOrder ?? (lastStep?.sortOrder ?? 0) + 1,
        status:       "PENDING",
        dueDate:      dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
      },
    });

    return created(step);
  } catch (e) { return serverError(e); }
}
