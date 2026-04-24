import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postAnnouncement } from "@/lib/announcements";
import { z } from "zod";

const createSchema = z.object({
  firstName:        z.string().min(1).max(100),
  lastName:         z.string().min(1).max(100),
  email:            z.string().email().optional().or(z.literal("")),
  phone:            z.string().max(30).optional(),
  title:            z.string().max(150).optional(),
  department:       z.string().max(100).optional(),
  location:         z.string().max(100).optional(),
  clientId:         z.string().optional(),
  managerId:        z.string().optional(),
  employmentStatus: z.enum(["ACTIVE","LEAVE","TERMINATED","CONTRACT","ONBOARDING"]).default("ACTIVE"),
  employmentType:   z.string().default("full-time"),
  level:            z.string().max(50).optional(),
  startDate:        z.string().optional(),
  isNeurodivergent: z.boolean().optional(),
  hasAccommodation: z.boolean().default(false),
  accommodationNote:z.string().max(500).optional(),
  tags:             z.array(z.string()).default([]),
});

export async function GET(_req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const employees = await db.employee.findMany({
      where: { orgId: user.orgId },
      include: {
        client:  { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
        _count:  { select: { directReports: true, trainingRecords: true } },
      },
      orderBy: [{ employmentStatus: "asc" }, { lastName: "asc" }],
    });
    return ok(employees);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const { email, startDate, clientId, managerId, ...rest } = parsed.data;

    const employee = await db.employee.create({
      data: {
        ...rest,
        orgId:     user.orgId,
        email:     email || null,
        startDate: startDate ? new Date(startDate) : null,
        clientId:  clientId || null,
        managerId: managerId || null,
      },
    });

    // Auto-announce new hire / onboarding
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const isOnboarding = employee.employmentStatus === "ONBOARDING";
    postAnnouncement({
      orgId:    user.orgId,
      authorId: user.id,
      announcementType: "ONBOARDING",
      title:   isOnboarding ? `Welcome aboard, ${employee.firstName}! 🎉` : `New team member: ${fullName}`,
      body:    `Please join us in welcoming ${fullName}${employee.title ? `, our new ${employee.title}` : ""}${employee.department ? ` in ${employee.department}` : ""}!${employee.startDate ? ` Start date: ${new Date(employee.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.` : ""}`,
      subjectName: fullName,
      subjectId:   employee.id,
    }).catch(() => {});

    return created(employee);
  } catch (e) { return serverError(e); }
}
