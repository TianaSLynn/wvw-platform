import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

const N8N_API_URL = process.env.N8N_API_URL ?? "http://localhost:5678";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const res = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "n8n unreachable", status: res.status }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json() as { data: unknown[] };
    return ok(data.data ?? []);
  } catch (e) {
    return serverError(e);
  }
}
