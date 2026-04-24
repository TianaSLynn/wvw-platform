import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const CATEGORIES = [
  "Regulatory Changes","Industry Trends","Threat Intelligence",
  "Client Intelligence","Technology","Economic","Other",
] as const;

const createSchema = z.object({
  category:       z.enum(CATEGORIES).default("Other"),
  title:          z.string().min(1),
  source:         z.string().optional(),
  severity:       z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
  summary:        z.string().optional(),
  actionRequired: z.string().optional(),
  signalDate:     z.string().optional(),
  url:            z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const signals = await db.externalSignal.findMany({
      where: { orgId: user.orgId, isActive: true },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    });
    return ok(signals);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { signalDate, url, ...rest } = parsed.data;
    const signal = await db.externalSignal.create({
      data: {
        ...rest,
        orgId:      user.orgId,
        addedById:  user.id,
        signalDate: signalDate ? new Date(signalDate) : null,
        url:        url || null,
      },
    });
    return created(signal);
  } catch (e) { return serverError(e); }
}
