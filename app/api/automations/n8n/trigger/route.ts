import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const N8N_API_URL = process.env.N8N_API_URL ?? "http://localhost:5678";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

const schema = z.object({
  workflowId: z.string(),
  webhookUrl: z.string().optional(),
  payload:    z.record(z.unknown()).optional(),
  source:     z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const { workflowId, webhookUrl, payload, source } = parsed.data;

    // If a webhook URL is provided, hit it directly
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: source ?? "wvw-platform", triggeredBy: user.id, ...payload }),
        signal: AbortSignal.timeout(10000),
      });
      return ok({ triggered: true, via: "webhook", status: res.status });
    }

    // Otherwise trigger via n8n API (manual execution)
    const res = await fetch(`${N8N_API_URL}/api/v1/workflows/${workflowId}/run`, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ runData: { source: source ?? "wvw-platform", userId: user.id, ...payload } }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to trigger workflow", status: res.status }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return ok({ triggered: true, via: "api", executionId: (data as Record<string, unknown>).executionId });
  } catch (e) {
    return serverError(e);
  }
}
