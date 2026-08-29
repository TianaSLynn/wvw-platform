import { getCurrentUser } from "@/lib/auth";
import { unauthorized, serverError, badRequest, tooManyRequests, ok } from "@/lib/api-response";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import OpenAI from "openai";
import { z } from "zod";

const schema = z.object({
  auditType:   z.string(),
  scope:       z.string().optional(),
  industry:    z.string().optional(),
  frameworks:  z.array(z.string()).default([]),
  objectives:  z.array(z.string()).default([]),
  templateId:  z.string().optional(), // force a specific WVW template
});

// Keyword → WVW template name fragment (used to match best-fit template)
const WVW_KEYWORD_MAP: Array<{ keywords: string[]; nameFragment: string }> = [
  { keywords: ["psych", "psychological", "safety"],       nameFragment: "Psychological Safety" },
  { keywords: ["burnout", "sustainability", "exhaustion"], nameFragment: "Burnout Risk" },
  { keywords: ["leadership", "trust", "integrity"],       nameFragment: "Leadership Integrity" },
  { keywords: ["moral", "injury", "ethical"],             nameFragment: "Moral Injury" },
  { keywords: ["neuro", "neuroinclusion", "neurodiverg"], nameFragment: "Neuroinclusion" },
  { keywords: ["dei", "diversity", "equity", "inclusion", "belonging"], nameFragment: "DEI Reality" },
  { keywords: ["entry", "fit", "readiness", "pre-audit"], nameFragment: "Entry Fit" },
];

async function findWvwTemplate(auditType: string, scope?: string, templateId?: string) {
  // If a specific template ID was requested, use it directly
  if (templateId) {
    return db.auditTemplate.findUnique({
      where: { id: templateId, isGlobal: true, isPublished: true },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  }

  // WVW templates are all HR type
  if (!["HR", "OPERATIONAL", "CUSTOM"].includes(auditType.toUpperCase())) return null;

  const globalTemplates = await db.auditTemplate.findMany({
    where: { isGlobal: true, isPublished: true, name: { startsWith: "WVW" } },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (globalTemplates.length === 0) return null;

  // Try keyword matching against scope/objectives
  const searchText = (scope ?? "").toLowerCase();
  for (const { keywords, nameFragment } of WVW_KEYWORD_MAP) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      const match = globalTemplates.find((t) => t.name.includes(nameFragment));
      if (match) return match;
    }
  }

  // Default to Core Organizational Resilience audit
  return globalTemplates.find((t) => t.name.includes("Core Organizational")) ?? globalTemplates[0] ?? null;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(rateLimitKey("ai:checklist", user.id), 10, 60_000);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { auditType, scope, industry, frameworks, objectives, templateId } = parsed.data;

    // ── 1. Try to load a WVW seeded template first ──────────────────────────
    const wvwTemplate = await findWvwTemplate(auditType, scope, templateId);

    if (wvwTemplate) {
      const sections = wvwTemplate.sections.map((section) => ({
        title:       section.title,
        description: section.description,
        items: section.items.map((item) => ({
          question:         item.question,
          guidance:         item.guidance,
          riskWeight:       item.riskWeight,
          isRequired:       item.isRequired,
          evidenceRequired: item.evidenceRequired,
          // WVW metadata
          qId:             item.qId,
          questionType:    item.questionType,
          reverseScored:   item.reverseScored,
          riskTag:         item.riskTag,
          pathwayTriggers: item.pathwayTriggers,
          industryTags:    item.industryTags,
          scenarioOptions: item.scenarioOptions,
        })),
      }));

      return ok({
        sections,
        source: "wvw-template",
        templateName: wvwTemplate.name,
        templateId: wvwTemplate.id,
      });
    }

    // ── 2. Fallback: AI generation ───────────────────────────────────────────
    const prompt = `You are an expert auditor at a professional consulting firm. Generate a comprehensive audit checklist for the following audit.

Audit Type: ${auditType}
Industry: ${industry ?? "General"}
Scope: ${scope ?? "General organizational audit"}
Compliance Frameworks: ${frameworks.length > 0 ? frameworks.join(", ") : "None specified"}
Objectives: ${objectives.length > 0 ? objectives.join("; ") : "General compliance and risk assessment"}

Generate a structured checklist with 3-5 sections, each containing 4-8 specific, actionable checklist items.

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "sections": [
    {
      "title": "Section Title",
      "description": "Brief section description",
      "items": [
        {
          "question": "Specific yes/no question the auditor should investigate",
          "guidance": "Brief guidance on how to test or verify this item",
          "riskWeight": 1.0,
          "isRequired": true,
          "evidenceRequired": false
        }
      ]
    }
  ]
}

Risk weights: 2.0 = critical control, 1.5 = important, 1.0 = standard, 0.5 = informational.
Make questions specific, actionable, and verifiable. Focus on what an auditor would actually check.`;

    const response = await new OpenAI().responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      input: prompt,
    });
    const text = response.output_text;

    let checklist: { sections: unknown[] };
    try {
      checklist = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return serverError(new Error("AI returned invalid JSON"));
      checklist = JSON.parse(match[0]);
    }

    return ok({ ...checklist, source: "ai" });
  } catch (e) {
    return serverError(e);
  }
}

// GET: list available WVW templates for the picker UI
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const templates = await db.auditTemplate.findMany({
      where: { isGlobal: true, isPublished: true },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        version: true,
        _count: { select: { sections: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok(templates);
  } catch (e) {
    return serverError(e);
  }
}
