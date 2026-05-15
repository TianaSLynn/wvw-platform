/**
 * Shared service for creating onboarding workflows with sequential blocking and document tracking.
 */
import { db } from "@/lib/db";
import {
  OnboardingStepTemplate,
  EMPLOYEE_ONBOARDING_STEPS,
  EMPLOYEE_OFFBOARDING_STEPS,
  CLIENT_ONBOARDING_STEPS,
  STUDENT_ONBOARDING_STEPS,
  INSTRUCTOR_ONBOARDING_STEPS,
} from "@/lib/onboarding-templates";

export type CreateWorkflowInput = {
  orgId:         string;
  entityType:    "EMPLOYEE" | "CLIENT" | "STUDENT" | "INSTRUCTOR";
  employeeId?:   string;
  clientId?:     string;
  studentName?:  string;
  studentEmail?: string;
  cohortId?:     string;
  type:          "ONBOARDING" | "OFFBOARDING";
  targetDate?:   Date | null;
  notes?:        string | null;
  template?:     OnboardingStepTemplate[];
};

export async function createOnboardingWorkflow(input: CreateWorkflowInput) {
  const { orgId, entityType, employeeId, clientId, studentName, studentEmail, cohortId, type, targetDate, notes, template } = input;

  let steps = template ?? (
    entityType === "CLIENT"     ? CLIENT_ONBOARDING_STEPS :
    entityType === "STUDENT"    ? STUDENT_ONBOARDING_STEPS :
    entityType === "INSTRUCTOR" ? INSTRUCTOR_ONBOARDING_STEPS :
    type === "OFFBOARDING"      ? EMPLOYEE_OFFBOARDING_STEPS :
    EMPLOYEE_ONBOARDING_STEPS
  );

  steps = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);

  const workflow = await db.onboardingWorkflow.create({
    data: {
      orgId,
      entityType,
      employeeId:   employeeId   ?? null,
      clientId:     clientId     ?? null,
      studentName:  studentName  ?? null,
      studentEmail: studentEmail ?? null,
      cohortId:     cohortId     ?? null,
      type,
      status:     "ACTIVE",
      startDate:  new Date(),
      targetDate: targetDate ?? null,
      notes:      notes ?? null,
      steps: {
        create: steps.map((s) => ({
          title:             s.title,
          description:       s.description,
          category:          s.category,
          sortOrder:         s.sortOrder,
          status:            s.blockedBySortOrder ? "BLOCKED" : "PENDING",
          documentRequired:  s.documentRequired  ?? false,
          documentLabel:     s.documentLabel     ?? null,
          documentCollected: false,
        })),
      },
    },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  // Wire blockedByStepId
  const stepsByOrder: Record<number, string> = {};
  for (const s of workflow.steps) stepsByOrder[s.sortOrder] = s.id;

  const blockUpdates = workflow.steps
    .map((s) => {
      const tpl = steps.find((t) => t.sortOrder === s.sortOrder);
      if (!tpl?.blockedBySortOrder) return null;
      const blockerId = stepsByOrder[tpl.blockedBySortOrder];
      return blockerId ? { id: s.id, blockedByStepId: blockerId } : null;
    })
    .filter(Boolean) as { id: string; blockedByStepId: string }[];

  if (blockUpdates.length > 0) {
    await Promise.all(
      blockUpdates.map((u) =>
        db.onboardingStep.update({ where: { id: u.id }, data: { blockedByStepId: u.blockedByStepId } })
      )
    );
  }

  return workflow;
}
