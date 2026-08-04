export * from "./correlation-id.js";
export * from "./payload-hash.js";

export type DataClassification = "public" | "internal" | "confidential" | "restricted";
export type Language = "en" | "es";

export type AutomationEventStatus =
  | "received"
  | "validating"
  | "rejected"
  | "duplicate"
  | "queued"
  | "processing"
  | "awaiting_external_system"
  | "awaiting_payment"
  | "awaiting_human_review"
  | "draft_created"
  | "completed"
  | "completed_with_warning"
  | "failed_retryable"
  | "failed_terminal"
  | "cancelled";

export interface AutomationEventInput {
  eventType: string;
  sourceSystem: string;
  sourceForm: string;
  sourceSite: string;
  submittedAt?: string;
  payload: Record<string, unknown>;
  language: Language;
  dataClassification: DataClassification;
}
