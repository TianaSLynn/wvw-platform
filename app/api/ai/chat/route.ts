import { getCurrentUser } from "@/lib/auth";
import { unauthorized, tooManyRequests } from "@/lib/api-response";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(rateLimitKey("ai:chat", user.id), 30, 60_000);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter);

    const { messages, context } = await req.json();

    // Build context from org data
    const [clientCount, auditCount, openFindings] = await Promise.all([
      db.client.count({ where: { orgId: user.orgId, isActive: true } }),
      db.audit.count({ where: { orgId: user.orgId, status: { in: ["FIELDWORK", "REVIEW", "PLANNING"] } } }),
      db.auditFinding.count({
        where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
    ]);

    const systemPrompt = `You are the WVW Intelligence AI assistant — an expert in audit management, HR consulting, compliance, and professional services operations.

Current organizational context:
- User: ${user.firstName} ${user.lastName} (${user.role})
- Organization: ${user.org?.name ?? "WVW"}
- Active clients: ${clientCount}
- Active audits: ${auditCount}
- Open findings: ${openFindings}
${context ? `- Current page context: ${context}` : ""}

You have deep expertise in:
- HR audits and compliance (EEOC, FLSA, ADA, FMLA)
- SOC 2, ISO 27001, HIPAA, NIST frameworks
- Professional services and consulting operations
- Risk assessment and remediation planning
- Financial controls and billing
- Employee wellness and organizational health

Be concise, specific, and actionable. Format responses clearly with bullet points or numbered lists when appropriate. If asked about specific audit findings or data you don't have access to, acknowledge that and suggest how to find it in the platform.`;

    // Stream the response
    const stream = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    });

    // Return a streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("[AI Chat Error]", e);
    return new Response(JSON.stringify({ error: "AI service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
