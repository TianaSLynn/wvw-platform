import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const CREDENTIAL_CODES = ["WAA","WCA","WCS","WEP"] as const;
const CREDENTIAL_TITLES: Record<string, string> = {
  WAA: "WVW Associate Auditor",
  WCA: "WVW Certified Auditor",
  WCS: "WVW Compliance Specialist",
  WEP: "WVW Engagement Partner",
};

function genVerifyId(code: string): string {
  const year = new Date().getFullYear();
  const seq  = Math.floor(Math.random() * 9000) + 1000;
  return `${code}-${year}-${seq.toString().padStart(4,"0")}`;
}

const createSchema = z.object({
  recipientName:  z.string().min(1),
  recipientId:    z.string().optional(),
  credentialCode: z.enum(CREDENTIAL_CODES),
  issuedAt:       z.string().optional(),
  expiresAt:      z.string().optional(),
  notes:          z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") ?? undefined;
    const credentials = await db.issuedCredential.findMany({
      where: { orgId: user.orgId, ...(code ? { credentialCode: code } : {}) },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { issuedAt: "desc" },
    });
    return ok(credentials);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { credentialCode, issuedAt, expiresAt, ...rest } = parsed.data;
    const credential = await db.issuedCredential.create({
      data: {
        ...rest,
        orgId:          user.orgId,
        credentialCode,
        credentialTitle: CREDENTIAL_TITLES[credentialCode] ?? credentialCode,
        verifyId:        genVerifyId(credentialCode),
        issuedAt:        issuedAt  ? new Date(issuedAt)  : new Date(),
        expiresAt:       expiresAt ? new Date(expiresAt) : null,
      },
    });
    return created(credential);
  } catch (e) { return serverError(e); }
}
