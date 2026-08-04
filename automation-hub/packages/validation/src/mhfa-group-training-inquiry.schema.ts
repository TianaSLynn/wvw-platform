import { z } from "zod";

/**
 * Matches the REAL live Netlify form `mhfa-group-training-inquiry` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-GRP-01 (group inquiry).
 */
export const mhfaGroupTrainingInquirySchema = z.object({
  "bot-field": z.string().max(0, "spam detected"),

  "contact-name": z.string().min(1).max(200),
  email: z.string().email(),
  "business-name": z.string().min(1).max(300),
  website: z.string().url().optional().or(z.literal("")),
  "number-of-participants": z.coerce.number().int().positive(),
  "preferred-dates": z.string().max(300).optional(),
  "delivery-format": z.string().optional(),
  "organization-type": z.string().optional(),
  "funding-source": z.string().optional(),
  "budget-range": z.string().optional(),
  "invoice-or-purchase-order-needed": z.string().optional(),
  "accommodation-needs": z.string().max(2000).optional(), // RESTRICTED — split before persistence
  "audience-and-goals": z.string().max(5000).optional(),
});

export type MhfaGroupTrainingInquiry = z.infer<typeof mhfaGroupTrainingInquirySchema>;

export const GROUP_INQUIRY_RESTRICTED_FIELDS: Array<keyof MhfaGroupTrainingInquiry> = ["accommodation-needs"];

export function splitGroupInquiryRestrictedFields(data: MhfaGroupTrainingInquiry) {
  const restricted: Record<string, unknown> = {};
  const general: Record<string, unknown> = { ...data };
  for (const field of GROUP_INQUIRY_RESTRICTED_FIELDS) {
    if (general[field] !== undefined) {
      restricted[field] = general[field];
      delete general[field];
    }
  }
  return { general, restricted };
}
