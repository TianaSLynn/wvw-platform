import { db } from "@/lib/db";
import { ok, badRequest } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

// Power Automate sends MS Forms responses here.
// URL format: /api/webhooks/ms-forms?postingId=<jobPostingId>&orgId=<orgId>
//
// Set up: In Power Automate, create a flow triggered by "Microsoft Forms - When a new response is submitted",
// then "HTTP - POST" to this URL with the body mapped from the form fields.
//
// Expected body (field names are flexible — we check multiple aliases):
// {
//   firstName | first_name | "First Name": string,
//   lastName  | last_name  | "Last Name":  string,
//   email     | "Email":                   string,
//   phone     | "Phone":                   string?,
//   linkedIn  | linkedin   | "LinkedIn":   string?,
//   portfolio | "Portfolio URL":            string?,
//   coverLetter | cover_letter | "Cover Letter": string?,
//   [any other fields are stored in `answers`]
// }

type MSFormsPayload = Record<string, unknown>;

function pick(obj: MSFormsPayload, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const postingId = url.searchParams.get("postingId");
  const orgId = url.searchParams.get("orgId");

  if (!postingId || !orgId) {
    return badRequest("Missing postingId or orgId query parameters");
  }

  // Verify the posting exists and belongs to this org
  const posting = await db.jobPosting.findFirst({
    where: { id: postingId, orgId },
    select: { id: true, orgId: true },
  });
  if (!posting) {
    return new Response("Job posting not found", { status: 404 });
  }

  let body: MSFormsPayload;
  try {
    body = (await req.json()) as MSFormsPayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const firstName = pick(body, "firstName", "first_name", "First Name", "FirstName");
  const lastName  = pick(body, "lastName",  "last_name",  "Last Name",  "LastName");
  const email     = pick(body, "email",     "Email",      "EmailAddress");

  if (!firstName || !lastName || !email) {
    return badRequest("Payload must include firstName, lastName, and email");
  }

  const phone       = pick(body, "phone",       "Phone",       "PhoneNumber")     || null;
  const linkedIn    = pick(body, "linkedIn",    "linkedin",    "LinkedIn")        || null;
  const portfolio   = pick(body, "portfolio",   "Portfolio",   "Portfolio URL")   || null;
  const coverLetter = pick(body, "coverLetter", "cover_letter","Cover Letter")    || null;

  // Store all remaining fields as answers JSON
  const knownKeys = new Set([
    "firstName","first_name","First Name","FirstName",
    "lastName","last_name","Last Name","LastName",
    "email","Email","EmailAddress",
    "phone","Phone","PhoneNumber",
    "linkedIn","linkedin","LinkedIn",
    "portfolio","Portfolio","Portfolio URL",
    "coverLetter","cover_letter","Cover Letter",
  ]);
  const answers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!knownKeys.has(k)) answers[k] = v;
  }

  const application = await db.jobApplication.create({
    data: {
      orgId,
      postingId,
      firstName,
      lastName,
      email,
      phone,
      linkedIn,
      portfolio,
      coverLetter,
      answers: answers as Prisma.InputJsonValue,
      status: "NEW",
    },
  });

  // Activity log so the dashboard "New Applications" card updates
  await db.activityLog.create({
    data: {
      orgId,
      action: `New application received — ${firstName} ${lastName} (${email})`,
      entityType: "JobApplication",
      entityId: application.id,
      metadata: { postingId, source: "microsoft-forms" },
    },
  }).catch(() => {});

  return ok({ received: true, applicationId: application.id });
}
