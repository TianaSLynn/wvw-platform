/**
 * Seed WVW job postings — actual open positions at Wholistic Vibes Wellness.
 * Run: npx tsx prisma/seed-wvw-jobs.ts
 *
 * Black-woman-owned | Psychological Safety • Neuroinclusion • Black Mental Health • Burnout Prevention
 * All paid roles are contingent upon available funding, grant awards, and organizational growth.
 * Applications are accepted via Microsoft Form (WVW Job & Volunteer Application Form).
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const LOCATION = "Baltimore, MD (Remote-Friendly)";
const APPLY_NOTE = `We strongly encourage neurodivergent, Black, Indigenous, LGBTQ+, and applicants with lived experience to apply.\n\nHow to apply: Submit your resume (or bio for volunteers), a short note about which role interests you and why you want to support Wholistic Vibes Wellness, and — for the EA role specifically — an example of how you have supported a neurodivergent leader.`;

type JobDef = {
  title: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER" | "FREELANCE";
  status: "PUBLISHED" | "DRAFT";
  department: string;
  location: string;
  remote: boolean;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  duration?: string;
  isPaid?: boolean;
  tags: string[];
  externalUrls?: string[];
};

const JOBS: JobDef[] = [
  // ─── PAID ROLES (HIGHEST PRIORITY FIRST) ────────────────────────────────

  {
    title: "Executive Assistant II & Operations Coordinator (Neuroinclusive Support Role)",
    type: "PART_TIME",
    status: "PUBLISHED",
    department: "Operations",
    location: LOCATION,
    remote: true,
    description: `Senior executive support role for WVW's neurodivergent Founder/CEO (ADHD, Anxiety, PTSD). This is the highest-priority open role at Wholistic Vibes Wellness.

You will build and maintain operational systems, manage day-to-day administrative functions, and coordinate WVW Academy logistics. The right person understands how to support a neurodivergent leader — not just by managing a calendar, but by proactively reducing cognitive load, anticipating needs, and creating structure that makes excellence possible.

Hours: 20–25 hours/week. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• Proven experience supporting an executive or founder, especially in a startup or mission-driven environment
• Experience working with or supporting neurodivergent leaders (ADHD, anxiety, PTSD, or similar) — this is a non-negotiable
• Strong systems thinking: you build structure from ambiguity, not just follow existing processes
• Proficiency in Microsoft 365 (Teams, Outlook, SharePoint, OneDrive, Planner)
• Academy or educational program coordination experience is a strong plus
• Discretion, adaptability, and warm professionalism under pressure
• For the EA role: include a specific example of supporting a neurodivergent leader in your application`,
    benefits: "Part-time 20–25 hrs/week · Remote-friendly · Mission-aligned work · Contingent on funding",
    tags: ["EA", "operations", "neuroinclusive", "neurodivergent", "executive-support", "ADHD", "academy", "highest-priority"],
    isPaid: true,
  },

  {
    title: "Program Coordinator – WVW Academy",
    type: "FULL_TIME",
    status: "PUBLISHED",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    description: `Run WVW Academy's CHW (Community Health Worker) certification cohorts from enrollment through completion. You will coordinate instructors, manage the participant experience, track outcomes, and ensure every cohort runs smoothly.

This role is the operational backbone of the Academy. Strong part-time candidates will also be considered. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• 2–4+ years experience in program coordination, adult education administration, or community health
• Familiarity with CHW training programs or community health workforce development preferred
• Strong organizational, scheduling, and communication skills
• Experience with enrollment, cohort management, or LMS platforms
• Maryland DOH CHW certification knowledge or willingness to learn
• Passion for health equity, Black mental health, and community wellness`,
    benefits: "Full-time (strong part-time considered) · Remote-friendly · Mission-driven program · Contingent on funding",
    tags: ["program-coordinator", "academy", "CHW", "community-health", "education", "enrollment"],
    isPaid: true,
  },

  {
    title: "Communications & Content Specialist",
    type: "PART_TIME",
    status: "PUBLISHED",
    department: "Marketing & Communications",
    location: LOCATION,
    remote: true,
    description: `Create the content that tells WVW's story — social media posts, newsletters, and grant storytelling that reflects our identity as a Black-woman-owned organization focused on psychological safety, neuroinclusion, and burnout prevention.

Part-time contractor preferred; full-time considered for the right candidate. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• Demonstrated content creation experience across social media (LinkedIn, Instagram) and email
• Strong writing, editing, and brand voice skills
• Experience writing for nonprofits, mission-driven organizations, or health/wellness brands
• Grant narrative writing experience is a strong plus
• Understanding of or lived experience with neuroinclusion, Black mental health, or DEI
• Proficiency in Canva, Mailchimp or similar email platform, and social scheduling tools`,
    benefits: "Part-time contractor (full-time considered) · Remote · Creative autonomy · Contingent on funding",
    tags: ["communications", "content", "social-media", "newsletter", "grants", "DEI", "marketing"],
    isPaid: true,
  },

  {
    title: "Organizational Wellness Associate",
    type: "FULL_TIME",
    status: "PUBLISHED",
    department: "Consulting",
    location: LOCATION,
    remote: true,
    description: `Support WVW's consulting engagements — conducting organizational assessments, facilitating wellness workshops, administering surveys, and preparing client deliverables.

You will work alongside the Founder/CEO on client projects that address psychological safety, burnout prevention, and organizational culture for mission-driven organizations. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• Background in organizational development, public health, social work, HR, or related field
• Experience facilitating workshops, focus groups, or community-based assessments
• Survey design and data collection experience (Google Forms, Microsoft Forms, Qualtrics, etc.)
• Strong written and verbal communication — able to prepare professional client deliverables
• Knowledge of or lived experience with psychological safety, Black mental health, burnout, or neuroinclusion
• Master's level education or equivalent experience preferred`,
    benefits: "Full-time · Remote-friendly · Direct client impact · Contingent on funding",
    tags: ["consulting", "wellness", "OD", "assessments", "workshops", "surveys", "DEI", "burnout"],
    isPaid: true,
  },

  {
    title: "Community Outreach & Engagement Specialist",
    type: "FULL_TIME",
    status: "PUBLISHED",
    department: "Community Outreach",
    location: LOCATION,
    remote: true,
    description: `Build WVW's community presence and partnerships across Baltimore and beyond. Recruit participants for WVW Academy programs, cultivate relationships with community organizations and health systems, and represent WVW at outreach events.

Full-time preferred; strong part-time candidates considered. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• 2–4+ years in community outreach, health education, social services, or workforce development
• Established network in Baltimore's health equity, Black community organizations, or CHW ecosystem preferred
• Demonstrated ability to build authentic relationships across diverse communities
• Experience with recruitment campaigns, tabling, and community events
• Knowledge of community health worker workforce pipeline programs
• Cultural humility and strong connection to WVW's mission`,
    benefits: "Full-time (strong part-time considered) · Remote-friendly · Community-centered work · Contingent on funding",
    tags: ["community-outreach", "engagement", "partnerships", "CHW", "recruitment", "Baltimore", "health-equity"],
    isPaid: true,
  },

  {
    title: "Academy Instructor / CHW Facilitator",
    type: "CONTRACT",
    status: "PUBLISHED",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    description: `Deliver trauma-informed Community Health Worker (CHW) training for WVW Academy cohorts. This is a per-cohort 1099 contractor role; instructors with strong performance may be invited back across multiple cohorts.

Rolling applications accepted — we hire instructors ahead of each new cohort launch.

${APPLY_NOTE}`,
    requirements: `• Must meet Maryland Department of Health (MD DOH) CHW instructor qualifications — this is required, not preferred
• Trauma-informed facilitation training and experience
• Experience delivering CHW certification training or community health education
• Ability to facilitate in-person, hybrid, or fully virtual formats
• Culturally responsive teaching practice; familiarity with Black mental health frameworks preferred
• Strong communication and learner-centered approach`,
    benefits: "Per-cohort 1099 contract · Rolling opportunities · Mission-aligned instruction",
    tags: ["instructor", "CHW", "community-health", "facilitator", "trauma-informed", "MD-DOH", "1099", "rolling"],
    isPaid: true,
  },

  {
    title: "WVW Academy Student Success & Retention Coordinator",
    type: "FULL_TIME",
    status: "PUBLISHED",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    description: `Mentor WVW Academy participants through their CHW training journey, support retention, track outcomes, and ensure every learner feels seen and supported from enrollment to certification.

Full-time preferred; strong part-time candidates considered. All paid roles are contingent upon available funding and grant awards.

${APPLY_NOTE}`,
    requirements: `• Background in student services, academic advising, social work, case management, or community health
• Experience supporting adult learners from underserved or underrepresented communities
• Strong interpersonal communication and empathy — this is a people-first role
• Retention program or mentoring experience a strong plus
• CRM or student information system experience preferred
• CHW certification or community health background is a plus`,
    benefits: "Full-time (strong part-time considered) · Remote-friendly · Student-centered work · Contingent on funding",
    tags: ["student-success", "retention", "academy", "CHW", "mentoring", "advising", "community-health"],
    isPaid: true,
  },

  // ─── VOLUNTEER & INTERN ROLES ────────────────────────────────────────────

  {
    title: "Content & Social Media Volunteer",
    type: "VOLUNTEER",
    status: "PUBLISHED",
    department: "Marketing & Communications",
    location: LOCATION,
    remote: true,
    duration: "5–10 hrs/week",
    description: `Help create posts, carousels, and reels for WVW's LinkedIn and Instagram focused on neuroinclusion, Black mental health, psychological safety, and organizational wellness.

This is a great way to start working with us and build portfolio experience in mission-driven content creation.

${APPLY_NOTE}`,
    requirements: `• Interest in neuroinclusion, Black mental health, organizational wellness, or DEI content
• Basic experience creating social media content (LinkedIn, Instagram)
• Proficiency or strong interest in Canva or similar design tools
• Self-directed and reliable`,
    benefits: "Portfolio-building · Mission-aligned experience · Potential pathway to paid role · Byline opportunities",
    tags: ["volunteer", "social-media", "content", "LinkedIn", "Instagram", "neuroinclusion", "DEI"],
    isPaid: false,
  },

  {
    title: "Community Outreach Volunteer",
    type: "VOLUNTEER",
    status: "PUBLISHED",
    department: "Community Outreach",
    location: LOCATION,
    remote: false,
    duration: "4–12 hrs/week",
    description: `Support WVW's event tabling, partnership outreach, and WVW Academy recruitment in Baltimore communities.

This is a great entry point if you're passionate about health equity and community wellness. Hybrid — some in-person presence in Baltimore preferred.

${APPLY_NOTE}`,
    requirements: `• Passion for community health, health equity, or CHW workforce development
• Comfortable with community-facing work — tabling, events, talking to people
• Reliable, culturally competent, and relationship-oriented
• Baltimore or DMV area access preferred for in-person events`,
    benefits: "Community connection · Network building · Potential pathway to paid outreach role",
    tags: ["volunteer", "community-outreach", "Baltimore", "tabling", "CHW", "health-equity"],
    isPaid: false,
  },

  {
    title: "Research & Grant Support Volunteer",
    type: "VOLUNTEER",
    status: "PUBLISHED",
    department: "Operations",
    location: LOCATION,
    remote: true,
    duration: "5–10 hrs/week",
    description: `Assist WVW with literature reviews, data collection, and basic grant research on Black mental health, neuroinclusion, psychological safety, and burnout prevention.

Ideal for students, researchers, or those transitioning into the nonprofit or public health space.

${APPLY_NOTE}`,
    requirements: `• Research experience or academic background in public health, psychology, social work, or related field
• Comfortable with literature reviews, database searches, and summarizing findings
• Basic understanding of grant research or willingness to learn
• Strong writing and attention to detail`,
    benefits: "Research portfolio · Access to WVW's knowledge base · Potential pathway to paid research role",
    tags: ["volunteer", "research", "grants", "Black-mental-health", "neuroinclusion", "public-health"],
    isPaid: false,
  },

  {
    title: "WVW Academy Program Volunteer",
    type: "VOLUNTEER",
    status: "PUBLISHED",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    duration: "6–10 hrs/week",
    description: `Help with WVW Academy cohort logistics, participant check-ins, and event support. This role is especially valuable for those on a future CHW career pathway who want hands-on experience in community health training programs.

${APPLY_NOTE}`,
    requirements: `• Interest in community health worker training or health workforce development
• Organized, dependable, and comfortable supporting learners
• Some experience with coordination, event support, or education preferred
• CHW certification pursuit or interest is a strong plus`,
    benefits: "CHW pathway experience · Academy network access · Potential stipend pathway · Letter of recommendation",
    tags: ["volunteer", "academy", "CHW", "program-support", "logistics", "community-health"],
    isPaid: false,
  },

  {
    title: "General Wellness Intern",
    type: "INTERNSHIP",
    status: "PUBLISHED",
    department: "Operations",
    location: LOCATION,
    remote: true,
    duration: "8–15 hrs/week",
    description: `Flexible internship providing support across WVW's operations, consulting, and Academy projects. Ideal for students or career changers looking for broad exposure to organizational wellness, neuroinclusion, and Black mental health practice.

Unpaid; stipend available if funding permits.

${APPLY_NOTE}`,
    requirements: `• Pursuing or recently completed a degree in public health, social work, HR, psychology, education, or a related field
• Curious, self-directed, and mission-aligned
• Comfortable with ambiguity and cross-functional work
• Career changers with relevant lived experience are strongly encouraged to apply`,
    benefits: "Broad operational and consulting exposure · Mentorship · Letter of recommendation · Stipend if funded",
    tags: ["intern", "wellness", "operations", "consulting", "academy", "career-change", "student"],
    isPaid: false,
  },
];

async function main() {
  console.log("🔍 Finding first organization...");
  const org = await db.organization.findFirst();
  if (!org) throw new Error("No organization found. Run the base seed first.");

  console.log(`📌 Org: ${org.name} (${org.id})`);
  console.log(`🚀 Seeding ${JOBS.length} WVW job postings...`);

  // Clear existing postings first (idempotent re-run)
  const deleted = await db.jobPosting.deleteMany({ where: { orgId: org.id } });
  if (deleted.count > 0) {
    console.log(`  🗑  Cleared ${deleted.count} existing job postings`);
  }

  let created = 0;
  for (const job of JOBS) {
    await db.jobPosting.create({
      data: {
        orgId:        org.id,
        title:        job.title,
        type:         job.type,
        status:       job.status,
        department:   job.department,
        location:     job.location,
        remote:       job.remote,
        description:  job.description.trim(),
        requirements: job.requirements?.trim() ?? null,
        benefits:     job.benefits?.trim() ?? null,
        salaryMin:    job.salaryMin ?? null,
        salaryMax:    job.salaryMax ?? null,
        salaryUnit:   job.salaryUnit ?? null,
        duration:     job.duration ?? null,
        isPaid:       job.isPaid ?? (job.type === "VOLUNTEER" ? false : null),
        tags:         job.tags,
        externalUrls: job.externalUrls ?? [],
        publishedAt:  job.status === "PUBLISHED" ? new Date() : null,
      },
    });
    created++;
    const flag = job.tags.includes("highest-priority") ? " ⭐ HIGHEST PRIORITY" : "";
    console.log(`  ✓ ${job.title} (${job.type})${flag}`);
  }

  console.log(`\n✅ Done — ${created} job postings created.`);
  console.log(`   7 paid roles (PUBLISHED) · 5 volunteer/intern roles (PUBLISHED)`);
  console.log(`   All paid roles are contingent upon funding & grant awards.`);
  console.log(`\n   Go to /jobs to manage postings and review incoming applications.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
