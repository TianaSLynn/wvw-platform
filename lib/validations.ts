import { z } from "zod";

// ─── Client ───────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name:           z.string().min(2).max(100),
  legalName:      z.string().optional(),
  industry:       z.string().optional(),
  size:           z.string().optional(),
  website:        z.string().url().optional().or(z.literal("")),
  description:    z.string().optional(),
  billingEmail:   z.string().email().optional().or(z.literal("")),
  taxId:          z.string().optional(),
  paymentTerms:   z.number().int().min(0).max(365).default(30),
  defaultRate:    z.number().positive().optional(),
  isActive:       z.boolean().default(true),
  onboardedAt:    z.string().datetime().optional(),
});

export const contactSchema = z.object({
  firstName:       z.string().min(1).max(50),
  lastName:        z.string().min(1).max(50),
  email:           z.string().email().optional().or(z.literal("")),
  phone:           z.string().optional(),
  title:           z.string().optional(),
  department:      z.string().optional(),
  isPrimary:       z.boolean().default(false),
  isDecisionMaker: z.boolean().default(false),
  notes:           z.string().optional(),
});

// ─── Project ──────────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  clientId:       z.string().cuid(),
  name:           z.string().min(2).max(200),
  code:           z.string().optional(),
  description:    z.string().optional(),
  type:           z.enum(["AUDIT","CONSULTING","ADVISORY","TRAINING","RETAINER","ASSESSMENT"]).default("CONSULTING"),
  status:         z.enum(["DISCOVERY","PLANNING","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"]).default("DISCOVERY"),
  priority:       z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]).default("MEDIUM"),
  startDate:      z.string().datetime().optional(),
  targetEndDate:  z.string().datetime().optional(),
  budget:         z.number().positive().optional(),
  hoursBudget:    z.number().positive().optional(),
  billingModel:   z.string().optional(),
  tags:           z.array(z.string()).default([]),
});

// ─── Audit ────────────────────────────────────────────────────────────────────

export const auditSchema = z.object({
  clientId:     z.string().cuid(),
  projectId:    z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
  templateId:   z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
  name:         z.string().min(2).max(200),
  code:         z.string().optional().or(z.literal("")).transform(v => v || undefined),
  description:  z.string().optional().or(z.literal("")).transform(v => v || undefined),
  type:         z.enum(["INTERNAL","EXTERNAL","COMPLIANCE","OPERATIONAL","FINANCIAL","IT","HR","RISK","CUSTOM"]).default("COMPLIANCE"),
  status:       z.enum(["DRAFT","PLANNING","FIELDWORK","REVIEW","REPORTING","COMPLETED","ARCHIVED"]).optional(),
  scope:        z.string().optional().or(z.literal("")).transform(v => v || undefined),
  objectives:   z.array(z.string()).default([]),
  planningStartDate:  z.string().optional().or(z.literal("")).transform(v => v || undefined),
  fieldworkStartDate: z.string().optional().or(z.literal("")).transform(v => v || undefined),
  fieldworkEndDate:   z.string().optional().or(z.literal("")).transform(v => v || undefined),
  reportDueDate:      z.string().optional().or(z.literal("")).transform(v => v || undefined),
  tags:         z.array(z.string()).default([]),
});

export const findingSchema = z.object({
  title:           z.string().min(2).max(300),
  description:     z.string().min(10),
  severity:        z.enum(["CRITICAL","HIGH","MEDIUM","LOW","INFORMATIONAL"]).default("MEDIUM"),
  category:        z.string().optional(),
  rootCause:       z.string().optional(),
  impact:          z.string().optional(),
  // Accept numeric 1-5 (from form) OR string "low"/"medium"/"high"
  likelihood:      z.union([
    z.string(),
    z.number().int().min(1).max(5).transform((n) => n <= 2 ? "low" : n <= 3 ? "medium" : "high"),
  ]).optional(),
  recommendation:  z.string().optional(),
  managementResponse: z.string().optional(),
  controlRefs:     z.array(z.string()).default([]),
  // Accept comma-separated string (from form's regulatoryRef field) or array
  regulatoryRef:   z.string().optional(),
  assigneeId:      z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
  dueDate:         z.string().datetime().optional().or(z.literal("")).transform(v => v || undefined),
});

export const checklistResponseSchema = z.object({
  response:   z.enum(["yes","no","partial","n/a","1","2","3","4","5"]),
  notes:      z.string().optional(),
  isCompleted: z.boolean().optional(),
});

// ─── Invoice ──────────────────────────────────────────────────────────────────

export const invoiceSchema = z.object({
  clientId:   z.string().cuid(),
  projectId:  z.string().cuid().optional(),
  issueDate:  z.string(),
  dueDate:    z.string(),
  currency:   z.string().default("USD"),
  taxRate:    z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).default(0),
  notes:      z.string().optional(),
  terms:      z.string().optional(),
  lineItems:  z.array(z.object({
    description: z.string().min(1),
    quantity:    z.number().positive().default(1),
    unitPrice:   z.number(),
    taxable:     z.boolean().default(true),
    sortOrder:   z.number().int().default(0),
  })).min(1),
});

// ─── Time Entry ───────────────────────────────────────────────────────────────

export const timeEntrySchema = z.object({
  projectId:   z.string().cuid().optional(),
  taskId:      z.string().cuid().optional(),
  description: z.string().min(2),
  date:        z.string(),  // YYYY-MM-DD
  hours:       z.number().positive().max(24),
  isBillable:  z.boolean().default(true),
  tags:        z.array(z.string()).default([]),
});

// ─── Remediation Action ───────────────────────────────────────────────────────

export const remediationSchema = z.object({
  title:       z.string().min(2).max(200),
  description: z.string().min(5),
  actionType:  z.string().optional(),
  priority:    z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]).default("MEDIUM"),
  assigneeId:  z.string().cuid().optional(),
  dueDate:     z.string().datetime().optional(),
});
