/**
 * Seed WVW job postings — all roles for the WVW Intelligence platform.
 * Run: npx tsx prisma/seed-wvw-jobs.ts
 *
 * Salary notes: Maryland/DC-area roles — expect 10-20% above national averages
 * due to cost of living near Fort George G. Meade.
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const LOCATION = "Maryland / DC-Area (Hybrid)";

type JobDef = {
  title: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER" | "FREELANCE";
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
};

const JOBS: JobDef[] = [
  // ─── EXECUTIVE / LEADERSHIP ──────────────────────────────────────────────
  {
    title: "Director of Consulting / Client Delivery",
    type: "CONTRACT",
    department: "Executive / Leadership",
    location: LOCATION,
    remote: true,
    salaryMin: 100, salaryMax: 200, salaryUnit: "hourly",
    description: `Oversees the WVW consulting team, client delivery, project quality, and ensures WVW's methodology — culture transformation, psychological safety, and burnout solutions — is applied effectively across all engagements.

Early-stage role: contract-first, transitioning to full-time as we scale. This person will shape how we show up for every client.`,
    requirements: `• 8–12+ years in organizational development, consulting, or senior leadership
• Master's or PhD in I-O Psychology, Business, or HR preferred
• Strong client management, facilitation, and P&L experience
• Certifications in coaching (ICF), OD, or related areas a plus
• Proficiency in CRM/project tools (Asana, Salesforce, etc.)
• Leadership + business development instincts required for early growth`,
    benefits: "Flexible contract terms · Mission-aligned work · Growth into full-time leadership · Equity conversation possible",
    tags: ["OD", "leadership", "consulting", "client-delivery", "psych-safety", "contract-to-hire"],
  },
  {
    title: "Director of Education (Academy Director)",
    type: "CONTRACT",
    department: "Executive / Leadership",
    location: LOCATION,
    remote: true,
    salaryMin: 60, salaryMax: 120, salaryUnit: "hourly",
    description: `Leads the WVW Academy — curriculum strategy, instructor oversight, program delivery, student outcomes, and accreditation/compliance.

This role defines how WVW teaches. You'll design the learning architecture, oversee instructors, and ensure our programs produce measurable, transformative outcomes for learners.`,
    requirements: `• Advanced degree in Education, Adult Learning, or related field
• 5–10+ years in training program management or curriculum leadership
• Experience with accreditation bodies (IACET, university partnerships) preferred
• Strong instructional design skills and LMS platform experience (Teachable, Moodle, etc.)
• Deep knowledge of adult education best practices and learning science`,
    benefits: "Shape WVW's entire learning ecosystem · Flexible schedule · Contract-to-hire pathway",
    tags: ["academy", "education", "curriculum", "adult-learning", "LMS", "accreditation"],
  },

  // ─── OPERATIONS / ADMIN ──────────────────────────────────────────────────
  {
    title: "Executive Operations Assistant (EA/PA)",
    type: "CONTRACT",
    department: "Operations",
    location: LOCATION,
    remote: true,
    salaryMin: 35, salaryMax: 60, salaryUnit: "hourly",
    description: `Supports the Founder/CEO with scheduling, strategic operations, client coordination, and high-level administration. This role is the connective tissue of WVW — keeping leadership organized and focused.

Contract-first, with a clear path to full-time as operations scale.`,
    requirements: `• 3–7+ years EA/PA experience, ideally in consulting or startup environments
• Strong organizational and project management skills
• Proficiency in Google Workspace, Microsoft 365, Slack, and calendar/scheduling tools
• Discretion, confidentiality, and proactive problem-solving
• Startup adaptability — comfortable wearing multiple hats`,
    benefits: "Direct access to founder · Flexible hours · Contract-to-hire opportunity",
    tags: ["EA", "operations", "admin", "executive-support", "startup"],
  },
  {
    title: "Administrative Coordinator",
    type: "INTERNSHIP",
    department: "Operations",
    location: LOCATION,
    remote: true,
    salaryMin: 20, salaryMax: 35, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months (pipeline to full-time)",
    description: `Handles day-to-day administrative support — scheduling, documentation, correspondence, and cross-team coordination. A great entry point for someone early in their career who wants to grow in operations or consulting support.`,
    requirements: `• 1–3 years admin or coordinator experience (or strong internship background)
• Excellent organization, communication, and attention to detail
• Proficiency in Microsoft Office / Google Suite
• Positive, can-do attitude in a fast-moving startup`,
    benefits: "Paid internship · Mentorship · Clear path to full-time Administrative role",
    tags: ["admin", "coordinator", "entry-level", "intern", "operations"],
  },
  {
    title: "Finance & Grants Manager",
    type: "CONTRACT",
    department: "Operations",
    location: LOCATION,
    remote: true,
    salaryMin: 50, salaryMax: 100, salaryUnit: "hourly",
    description: `Manages WVW's budgeting, financial reporting, grants/funding strategy, and compliance — especially for the Academy's nonprofit-adjacent programs and grant-funded initiatives.`,
    requirements: `• Bachelor's in Finance, Accounting, or related field
• 5+ years experience with budgeting, reporting, and grant management
• Nonprofit or consulting finance background preferred
• Proficiency in QuickBooks, Excel, and grant management software
• Fundraising or foundation relationship experience a plus`,
    benefits: "Impactful financial stewardship · Flexible contract schedule · Growth opportunity",
    tags: ["finance", "grants", "budgeting", "nonprofit", "compliance"],
  },
  {
    title: "HR & Internal Culture Manager",
    type: "CONTRACT",
    department: "Operations",
    location: LOCATION,
    remote: true,
    salaryMin: 50, salaryMax: 110, salaryUnit: "hourly",
    description: `Handles WVW's internal HR operations, culture building (aligned with our own expertise), talent management, and employee wellbeing. Uniquely, this person will practice what WVW preaches — applying psych safety and burnout prevention inside our own team.`,
    requirements: `• Bachelor's or Master's in HR, Organizational Psychology, or related field
• 5+ years HR experience; SHRM-CP or PHR certification preferred
• Deep expertise in culture, DEI, and psychological safety frameworks
• Experience with HRIS tools (BambooHR, etc.)
• Passion for living the WVW mission internally`,
    benefits: "Mission-aligned HR work · Flexible contract terms · Culture-first environment",
    tags: ["HR", "culture", "DEI", "psych-safety", "internal", "SHRM"],
  },

  // ─── CONSULTING TEAM ─────────────────────────────────────────────────────
  {
    title: "Organizational Culture Consultant",
    type: "CONTRACT",
    department: "Consulting",
    location: LOCATION,
    remote: true,
    salaryMin: 75, salaryMax: 150, salaryUnit: "hourly",
    description: `Delivers client engagements focused on culture transformation, organizational assessments, facilitated workshops, and change management. Works directly with client leadership teams to identify cultural friction points and design solutions.`,
    requirements: `• 5–10+ years in OD/organizational consulting
• Master's in I-O Psychology, HR, or Business preferred
• Strong facilitation skills and assessment tool proficiency (culture surveys, 360s, etc.)
• Portfolio of measurable client outcomes
• Experience with burnout prevention and psychological safety frameworks is a strong plus`,
    benefits: "Project-based contract · Mission-driven work · Collaborative team",
    tags: ["OD", "culture", "consulting", "facilitation", "change-management"],
  },
  {
    title: "Psychological Safety & Burnout Specialist",
    type: "CONTRACT",
    department: "Consulting",
    location: LOCATION,
    remote: true,
    salaryMin: 80, salaryMax: 200, salaryUnit: "hourly",
    description: `WVW's most niche and high-value specialty. This person designs and delivers psychological safety workshops, burnout audits, and wellbeing programs for client organizations. Niche expertise commands premium rates — and makes real impact.

Informed by frameworks like Google's Project Aristotle, Amy Edmondson's research, and WVW's proprietary methodology.`,
    requirements: `• Background in psychology, HR, or wellness — clinical or organizational
• 5+ years in relevant applied work
• Certifications in coaching, burnout prevention, or psych safety facilitation
• Data-driven approach to workshop design and outcomes measurement
• Ability to work with both executives and frontline teams`,
    benefits: "Premium contract rates · Thought leadership opportunities · WVW Academy instructor track",
    tags: ["psych-safety", "burnout", "wellbeing", "coaching", "workshops", "Google-Project-Aristotle"],
  },
  {
    title: "Junior Consultant / Associate",
    type: "INTERNSHIP",
    department: "Consulting",
    location: LOCATION,
    remote: true,
    salaryMin: 30, salaryMax: 60, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months (pipeline to contract consultant)",
    description: `Supports senior consultants on research, client delivery, workshop prep, and project management. A pipeline role for emerging OD talent — ideal for graduate students or early-career professionals who want hands-on consulting experience in culture and psych safety.`,
    requirements: `• Bachelor's (Master's preferred) in HR, Psychology, Organizational Behavior, or related
• 1–3 years or strong internship/practicum experience
• Analytical and facilitation skills
• Curious, adaptable, and coachable`,
    benefits: "Paid internship · Mentorship from senior consultants · Path to full associate contract",
    tags: ["junior-consultant", "OD", "associate", "entry-level", "intern"],
  },
  {
    title: "Research & Data Analyst",
    type: "INTERNSHIP",
    department: "Consulting",
    location: LOCATION,
    remote: true,
    salaryMin: 35, salaryMax: 70, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months (pipeline to contract role)",
    description: `Conducts research and data analysis on culture metrics, burnout survey results, client engagement outcomes, and people analytics. Turns data into insights that drive WVW's consulting and academy strategy.`,
    requirements: `• Bachelor's in Data Science, Statistics, Psychology, or related field
• Proficiency in Excel, SQL, and ideally R or Python
• Experience with survey platforms (Qualtrics, SurveyMonkey, etc.)
• People analytics or organizational research experience is a strong plus
• Strong data storytelling and visualization skills`,
    benefits: "Paid internship · Real-world people analytics experience · Path to contract role",
    tags: ["data", "research", "analytics", "people-analytics", "qualtrics", "intern"],
  },

  // ─── BUSINESS DEVELOPMENT + MARKETING ───────────────────────────────────
  {
    title: "Business Development & Partnerships Manager",
    type: "CONTRACT",
    department: "Business Development",
    location: LOCATION,
    remote: true,
    salaryMin: 60, salaryMax: 120, salaryUnit: "hourly",
    description: `Drives client acquisition, strategic partnerships, and revenue growth for WVW. Builds relationships with HR leaders, Chief People Officers, and organizational leaders who are ready to invest in culture transformation.

Commission on closed deals available in addition to base contract rate.`,
    requirements: `• 5+ years sales or BD experience in consulting, professional services, or HR tech
• CRM proficiency (Salesforce, HubSpot, etc.)
• Strong network in HR, leadership development, or DEI
• Consultative selling approach — this isn't transactional
• Passion for WVW's mission is essential`,
    benefits: "Competitive contract rate + commission structure · Mission-aligned growth work · Contract-to-hire pathway",
    tags: ["business-development", "sales", "partnerships", "BD", "consulting"],
  },
  {
    title: "Marketing & Brand Strategist",
    type: "CONTRACT",
    department: "Marketing",
    location: LOCATION,
    remote: true,
    salaryMin: 50, salaryMax: 100, salaryUnit: "hourly",
    description: `Develops WVW's brand strategy and marketing campaigns to position us as the premier authority in organizational culture, psychological safety, and burnout prevention.

Shapes how WVW shows up across digital channels, thought leadership platforms, and client-facing materials.`,
    requirements: `• 4–7+ years marketing experience; B2B or professional services background preferred
• Strong SEO, content strategy, and analytics tools proficiency (Google Analytics, etc.)
• Experience building brand authority in a niche/expertise-driven market
• Portfolio of campaigns that drove measurable business results`,
    benefits: "Creative autonomy · Mission-driven brand building · Flexible contract schedule",
    tags: ["marketing", "brand", "strategy", "B2B", "content", "SEO"],
  },
  {
    title: "Content & Social Media Coordinator",
    type: "INTERNSHIP",
    department: "Marketing",
    location: LOCATION,
    remote: true,
    salaryMin: 20, salaryMax: 40, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months",
    description: `Creates and schedules content across LinkedIn and other platforms to build WVW's thought leadership and visibility in the organizational wellness space.

Great opportunity for someone passionate about content, social media, and organizational culture — especially from a DEI, wellness, or psych safety lens.`,
    requirements: `• 1–3 years content or social media experience
• Proficiency in Canva, Hootsuite (or similar), and LinkedIn content strategy
• Strong writing and storytelling ability
• Interest in organizational wellness, DEI, or leadership development`,
    benefits: "Paid internship · Build portfolio · Potential conversion to part-time contract",
    tags: ["social-media", "content", "LinkedIn", "marketing", "intern", "DEI"],
  },
  {
    title: "Graphic Designer",
    type: "CONTRACT",
    department: "Marketing",
    location: LOCATION,
    remote: true,
    salaryMin: 30, salaryMax: 70, salaryUnit: "hourly",
    description: `Designs visual assets for WVW Academy course materials, client presentations, marketing campaigns, and brand identity. Creates visuals that communicate authority, warmth, and cultural intelligence.`,
    requirements: `• Strong portfolio demonstrating brand consistency and visual storytelling
• Proficiency in Adobe Creative Suite and/or Figma
• Experience in branding for professional services or education preferred
• Attention to detail and ability to work within WVW brand guidelines`,
    benefits: "Flexible project-based contract · Creative work · Mission-aligned brand",
    tags: ["design", "graphic-design", "branding", "Figma", "Adobe", "visual"],
  },
  {
    title: "Copywriter",
    type: "CONTRACT",
    department: "Marketing",
    location: LOCATION,
    remote: true,
    salaryMin: 30, salaryMax: 60, salaryUnit: "hourly",
    description: `Writes website copy, client proposals, academy course descriptions, social media content, and thought leadership articles that reflect WVW's voice: expert, warm, and uncompromising in quality.`,
    requirements: `• Strong writing portfolio across B2B, marketing, and/or education contexts
• Ability to translate complex OD/psych safety concepts into accessible copy
• Experience with SEO-informed writing a plus
• Intern track available for strong writers at the graduate level`,
    benefits: "Flexible contract · Build expertise in OD/wellness content · Potential internship track",
    tags: ["copywriting", "content", "writing", "B2B", "proposals", "education"],
  },

  // ─── WVW ACADEMY ─────────────────────────────────────────────────────────
  {
    title: "Lead Instructor",
    type: "CONTRACT",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 50, salaryMax: 150, salaryUnit: "hourly",
    description: `Delivers core WVW Academy training programs — culture transformation, psychological safety, burnout prevention, and wellness for organizations. May deliver live, virtual, or hybrid sessions to cohorts of leaders and teams.

Expert instructors with specialized niche expertise earn at the higher end of this range.`,
    requirements: `• Deep subject-matter expertise in OD, psych safety, wellness, or related field
• Facilitation certifications (ICF coach, certified facilitator, etc.) preferred
• Virtual and in-person delivery experience
• Ability to adapt content for different organizational audiences`,
    benefits: "Premium hourly rates for experts · Flexible delivery schedule · Thought leadership platform",
    tags: ["instructor", "training", "facilitation", "academy", "psych-safety", "OD"],
  },
  {
    title: "Assistant Instructor",
    type: "INTERNSHIP",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 25, salaryMax: 50, salaryUnit: "hourly",
    isPaid: true,
    duration: "Per cohort / semester",
    description: `Supports lead instructors in WVW Academy programs — facilitates small group discussions, manages logistics, provides learner support, and assists with curriculum delivery.

Ideal for academy alumni, graduate students, or emerging facilitators building their teaching portfolio.`,
    requirements: `• Emerging expertise in OD, wellness, education, or psych safety
• Strong communication and group facilitation skills
• Interest in adult education and training program delivery`,
    benefits: "Paid role · Mentorship from master facilitators · Path to Lead Instructor contract",
    tags: ["instructor", "academy", "assistant", "facilitation", "intern"],
  },
  {
    title: "Curriculum & Instructional Designer",
    type: "CONTRACT",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 45, salaryMax: 90, salaryUnit: "hourly",
    description: `Designs WVW Academy courses, workshop materials, and e-learning experiences using adult learning principles and instructional design best practices. Translates WVW's methodology into scalable, engaging learning experiences.`,
    requirements: `• Instructional design experience with portfolio of courses/learning experiences
• Proficiency in tools like Articulate Storyline, Rise, or equivalent LMS tools
• Strong understanding of adult learning principles (ADDIE, Bloom's Taxonomy, etc.)
• Experience designing for blended or async learning environments`,
    benefits: "Creative design work · Mission-driven content · Flexible contract",
    tags: ["instructional-design", "curriculum", "e-learning", "LMS", "adult-learning", "academy"],
  },
  {
    title: "Student Success Coordinator",
    type: "INTERNSHIP",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 25, salaryMax: 40, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months (pipeline to full-time)",
    description: `Supports WVW Academy students through their learning journey — retention outreach, mentoring connections, outcome tracking, and celebration of completions. Ensures every learner feels seen and supported.`,
    requirements: `• Customer service, advising, or education support background
• Empathy and strong interpersonal communication
• CRM tool proficiency (or willingness to learn)
• Interest in adult education and learner success`,
    benefits: "Paid internship · Meaningful student-facing work · Path to full-time Student Success role",
    tags: ["student-success", "academy", "support", "retention", "intern"],
  },
  {
    title: "Admissions & Enrollment Coordinator",
    type: "INTERNSHIP",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 25, salaryMax: 40, salaryUnit: "hourly",
    isPaid: true,
    duration: "3–6 months (pipeline to full-time)",
    description: `Manages the WVW Academy application process, enrollment communications, and student onboarding. The first human touchpoint for prospective learners — representing WVW's warmth and professionalism.`,
    requirements: `• Administrative or sales/admissions background preferred
• CRM proficiency (or eager to learn)
• Strong written communication
• Organized, detail-oriented, and people-focused`,
    benefits: "Paid internship · Learn admissions in a mission-driven context · Path to full-time role",
    tags: ["admissions", "enrollment", "academy", "coordinator", "intern"],
  },
  {
    title: "Compliance & Accreditation Specialist",
    type: "CONTRACT",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    salaryMin: 45, salaryMax: 80, salaryUnit: "hourly",
    description: `Ensures WVW Academy meets regulatory requirements and accreditation standards for professional development programs. Manages compliance documentation, accreditation body relationships, and ongoing standards tracking.`,
    requirements: `• Knowledge of relevant accreditation bodies (IACET, SHRM, ICF, state agencies, etc.)
• Compliance or education administration experience
• Strong documentation and process management skills
• Attention to regulatory detail`,
    benefits: "Flexible contract · Specialized niche work · Contribute to WVW's credentialing ecosystem",
    tags: ["compliance", "accreditation", "regulation", "academy", "IACET", "SHRM"],
  },

  // ─── TECH / WVW INTELLIGENCE ─────────────────────────────────────────────
  {
    title: "Product Manager",
    type: "CONTRACT",
    department: "Technology",
    location: LOCATION,
    remote: true,
    salaryMin: 70, salaryMax: 120, salaryUnit: "hourly",
    description: `Oversees digital product strategy and roadmap for WVW Intelligence — our consulting platform, academy tools, and assessment dashboards. Works closely with the development team to ship features that serve clients, consultants, and learners.`,
    requirements: `• 5+ years product management experience
• Agile/Scrum methodology proficiency
• Technical background sufficient to partner effectively with engineers
• Experience in SaaS, HRTech, or EdTech preferred
• Strong ability to translate user needs into product requirements`,
    benefits: "Build meaningful HR/wellness tech · Flexible contract · Potential equity conversation",
    tags: ["product-manager", "PM", "SaaS", "HRTech", "EdTech", "Agile"],
  },
  {
    title: "Software Developer / Engineer",
    type: "CONTRACT",
    department: "Technology",
    location: LOCATION,
    remote: true,
    salaryMin: 60, salaryMax: 130, salaryUnit: "hourly",
    description: `Builds and maintains WVW Intelligence — our Next.js platform powering consulting operations, the WVW Academy LMS, client dashboards, and audit tools. Works on a modern stack with real user impact.`,
    requirements: `• Strong proficiency in JavaScript/TypeScript and React/Next.js
• Backend API experience (Node, Prisma/PostgreSQL, or equivalent)
• Experience building production SaaS or enterprise applications
• Full-stack ability preferred; strong frontend or backend specialists considered
• Interest in HRTech or organizational wellness a plus`,
    benefits: "Work on cutting-edge wellness/HR platform · Flexible remote contract · Modern tech stack",
    tags: ["software-engineer", "developer", "Next.js", "TypeScript", "React", "full-stack"],
  },
  {
    title: "Data Systems Analyst",
    type: "CONTRACT",
    department: "Technology",
    location: LOCATION,
    remote: true,
    salaryMin: 50, salaryMax: 90, salaryUnit: "hourly",
    description: `Manages WVW's data infrastructure — survey data pipelines, client analytics, reporting dashboards, and data governance. Ensures our insights are accurate, timely, and actionable for consultants and clients.`,
    requirements: `• Strong SQL and database management skills
• Analytics tools experience (Tableau, Power BI, or similar)
• Data privacy and governance knowledge
• Experience with survey data or people analytics preferred`,
    benefits: "Shape WVW's data strategy · Flexible contract · Impactful analytics work",
    tags: ["data", "analytics", "SQL", "BI", "data-governance", "people-analytics"],
  },

  // ─── VOLUNTEER ───────────────────────────────────────────────────────────
  {
    title: "Community & Event Support Volunteer",
    type: "VOLUNTEER",
    department: "Community",
    location: LOCATION,
    remote: true,
    description: `Support WVW community events, workshops, and online programs as a volunteer. Help with logistics, participant support, and community engagement. Great for those who believe in our mission and want to contribute while building their own network.

Volunteers are never relied upon for core operations — this is purely additive, relationship-building, and pipeline-focused.`,
    requirements: `• Genuine interest in WVW's mission (culture, psych safety, burnout, DEI)
• Basic organizational and communication skills
• Reliable and proactive
• Potential future hire — this is a talent pipeline role`,
    benefits: "Network access · Exposure to WVW methodology · Potential stipend conversion · Letter of recommendation",
    tags: ["volunteer", "community", "events", "DEI", "mission-driven", "pipeline"],
    isPaid: false,
  },
  {
    title: "Peer Support & Alumni Mentor Volunteer",
    type: "VOLUNTEER",
    department: "WVW Academy",
    location: LOCATION,
    remote: true,
    description: `Academy alumni and experienced practitioners volunteer as peer mentors — supporting current students, answering questions, and sharing lived experience in organizational wellness and consulting.`,
    requirements: `• WVW Academy alumni or 3+ years experience in OD/wellness/HR
• Commitment to at least 1–2 hours/month of peer support
• Empathy, patience, and peer coaching instincts`,
    benefits: "Stay connected to WVW community · Build mentorship experience · Priority for paid roles",
    tags: ["volunteer", "mentor", "alumni", "peer-support", "academy"],
    isPaid: false,
  },
  {
    title: "Content Support Volunteer",
    type: "VOLUNTEER",
    department: "Marketing",
    location: LOCATION,
    remote: true,
    description: `Help WVW with light content tasks — proofreading, social media research, resource curation, or basic writing support. Ideal for students, emerging writers, or those in career transition who want mission-aligned portfolio experience.`,
    requirements: `• Interest in organizational culture, wellness, DEI, or psych safety topics
• Basic writing and research skills
• Self-directed and reliable`,
    benefits: "Portfolio work · Byline opportunities · Mission-aligned experience · Potential paid conversion",
    tags: ["volunteer", "content", "writing", "social-media", "student"],
    isPaid: false,
  },
];

async function main() {
  console.log("🔍 Finding first organization...");
  const org = await db.organization.findFirst();
  if (!org) throw new Error("No organization found. Run the base seed first.");

  console.log(`📌 Org: ${org.name} (${org.id})`);
  console.log(`🚀 Seeding ${JOBS.length} WVW job postings...`);

  let created = 0;
  for (const job of JOBS) {
    await db.jobPosting.create({
      data: {
        orgId:       org.id,
        title:       job.title,
        type:        job.type,
        status:      "DRAFT",
        department:  job.department,
        location:    job.location,
        remote:      job.remote,
        description: job.description.trim(),
        requirements: job.requirements?.trim() ?? null,
        benefits:    job.benefits?.trim() ?? null,
        salaryMin:   job.salaryMin ?? null,
        salaryMax:   job.salaryMax ?? null,
        salaryUnit:  job.salaryUnit ?? null,
        duration:    job.duration ?? null,
        isPaid:      job.isPaid ?? (job.type === "VOLUNTEER" ? false : null),
        tags:        job.tags,
        externalUrls: [],
      },
    });
    created++;
    console.log(`  ✓ ${job.title} (${job.type})`);
  }

  console.log(`\n✅ Done — ${created} job postings created with status DRAFT ("Not Ready").`);
  console.log(`   Go to /jobs to set each role's status: Not Ready → Ready → Open → Closed → Filled`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
