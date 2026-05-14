import { getCurrentUser } from "@/lib/auth";
import { unauthorized, serverError, badRequest, tooManyRequests } from "@/lib/api-response";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const schema = z.object({
  auditType:   z.string(),
  scope:       z.string().optional(),
  industry:    z.string().optional(),
  frameworks:  z.array(z.string()).default([]),
  objectives:  z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(rateLimitKey("ai:checklist", user.id), 10, 60_000);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { auditType, scope, industry, frameworks, objectives } = parsed.data;

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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";

    // Parse and validate the JSON response
    let checklist: { sections: unknown[] };
    try {
      checklist = JSON.parse(text.trim());
    } catch {
      // Try to extract JSON if wrapped in markdown
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return serverError(new Error("AI returned invalid JSON"));
      checklist = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ data: checklist }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return serverError(e);
  }
}
