import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  url:     z.string().url("Must be a valid URL"),
  auditId: z.string().min(1),
  title:   z.string().optional(),
  tags:    z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

    const { url, auditId, title, tags } = parsed.data;

    // Verify audit belongs to user's org
    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: { id: true },
    });
    if (!audit) return badRequest("Audit not found");

    // Fetch page metadata (title, description) from the URL
    let pageTitle = title ?? url;
    let description: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "WVW-Intelligence/2.0 (Evidence Capture Bot)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1] && !title) pageTitle = titleMatch[1].trim().slice(0, 200);
        // Extract description
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        if (descMatch?.[1]) description = descMatch[1].trim().slice(0, 500);
      }
    } catch {
      // Network fetch is best-effort — we still save the evidence record
    }

    const evidence = await db.evidence.create({
      data: {
        type:        "LINK",
        title:       pageTitle,
        description,
        externalUrl: url,
        tags:        tags ?? [],
        collectedAt: new Date(),
        auditId,
        uploadedById: user.id,
      },
      include: {
        audit: { select: { id: true, name: true, code: true, client: { select: { name: true } } } },
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return ok({ evidence, message: "URL captured as evidence" });
  } catch (e) {
    return serverError(e);
  }
}
