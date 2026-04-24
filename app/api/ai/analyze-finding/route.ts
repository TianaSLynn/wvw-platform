import { getCurrentUser } from "@/lib/auth";
import { unauthorized, serverError, badRequest } from "@/lib/api-response";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const schema = z.object({
  findingTitle:    z.string(),
  findingDesc:     z.string(),
  severity:        z.string(),
  auditType:       z.string(),
  industry:        z.string().optional(),
  frameworks:      z.array(z.string()).default([]),
  existingFindings: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { findingTitle, findingDesc, severity, auditType, industry, frameworks, existingFindings } = parsed.data;

    const prompt = `You are a senior auditor and risk expert. Analyze this audit finding and provide actionable intelligence.

Finding Title: ${findingTitle}
Finding Description: ${findingDesc}
Severity: ${severity}
Audit Type: ${auditType}
Industry: ${industry ?? "General"}
Compliance Frameworks: ${frameworks.join(", ") || "None specified"}
Other findings in this audit: ${existingFindings.slice(0, 5).join("; ") || "None"}

Provide a structured analysis. Respond ONLY with valid JSON (no markdown):
{
  "rootCauses": ["list of likely root causes"],
  "impact": "clear description of business/compliance impact",
  "likelihood": "high|medium|low",
  "riskScore": 75,
  "recommendation": "specific, actionable remediation recommendation",
  "quickWins": ["immediate actions to reduce risk within 30 days"],
  "controlRefs": ["relevant control references e.g. SOC2-CC6.1, ISO27001-A.9.2.1"],
  "relatedRisks": ["other risks this finding may indicate"],
  "managementResponse": "suggested management response template"
}

Risk score should be 0-100 based on severity and likelihood combination.`;

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";

    let analysis: unknown;
    try {
      analysis = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return serverError(new Error("AI returned invalid JSON"));
      analysis = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ data: analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return serverError(e);
  }
}
