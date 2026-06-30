import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SLUG = "mhfa-training";

async function main() {
  const existing = await db.survey.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Survey already exists at /s/${SLUG} — skipping.`);
    console.log(`Edit it at /surveys/${existing.id}/builder`);
    return;
  }

  const org = await db.organization.findFirst();
  if (!org) throw new Error("No organization found");

  const creator = await db.user.findFirst({ where: { orgId: org.id, role: "SUPER_ADMIN" } })
    ?? await db.user.findFirst({ where: { orgId: org.id } });
  if (!creator) throw new Error("No user found to assign as survey creator");

  const survey = await db.survey.create({
    data: {
      orgId: org.id,
      createdById: creator.id,
      title: "Mental Health First Aid Training — Team Registration",
      description:
        "Register your team for WVW's Mental Health First Aid training. We'll use this information to prepare materials, confirm attendance, and follow up with session details.",
      slug: SLUG,
      status: "ACTIVE",
      isAnonymous: false,
      showProgress: true,
      allowMultiple: true,
      confirmMessage:
        "You're registered! A confirmation with session details will be sent to your email shortly. Questions in the meantime — reach out to your WVW contact.",
      publishedAt: new Date(),
      questions: {
        create: [
          {
            type: "short_text",
            title: "Pronouns",
            description: "e.g. she/her, he/him, they/them",
            required: true,
            sortOrder: 0,
          },
          {
            type: "short_text",
            title: "Organization Name",
            required: true,
            sortOrder: 1,
          },
          {
            type: "short_text",
            title: "Job Title / Role",
            required: true,
            sortOrder: 2,
          },
          {
            type: "short_text",
            title: "Team / Department",
            required: false,
            sortOrder: 3,
          },
          {
            type: "multiple_choice",
            title: "Which Mental Health First Aid course are you registering for?",
            options: ["Adult MHFA", "Youth MHFA", "Not sure — please advise"],
            required: true,
            sortOrder: 4,
          },
          {
            type: "long_text",
            title: "Accessibility needs or accommodations",
            description: "Let us know if you need anything to fully participate (optional)",
            required: false,
            sortOrder: 5,
          },
        ],
      },
    },
  });

  console.log(`✓ Created "${survey.title}"`);
  console.log(`  Public link: https://wvw-platform.vercel.app/s/${SLUG}`);
  console.log(`  Edit in builder: https://wvw-platform.vercel.app/surveys/${survey.id}/builder`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
