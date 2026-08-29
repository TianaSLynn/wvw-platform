import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — WVW Intelligence",
  description: "How Wholistic Vibes Wellness collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "May 18, 2026";
const COMPANY        = "Wholistic Vibes Wellness, LLC";
const EMAIL          = "privacy@wvwconsulting.com";
const SITE           = "WVW Intelligence";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1B]">
      {/* Nav */}
      <header className="border-b border-[#1A1A1B]/10 bg-[#F5F5F0]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1B] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-[#1A1A1B] tracking-tight">{SITE}</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#708090] hover:text-[#1A1A1B] transition-colors">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-[#708090] text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-[#1A1A1B]">
          <Section title="1. Introduction">
            <p>
              {COMPANY} ("{COMPANY}", "we", "our", or "us") operates {SITE}, a professional services
              intelligence and audit management platform (the "Platform"). This Privacy Policy explains how we
              collect, use, disclose, and protect your information when you use our Platform.
            </p>
            <p>
              By accessing or using {SITE}, you agree to this Privacy Policy. If you do not agree, please
              discontinue use immediately.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="2.1 Information You Provide">
              <ul>
                <li><strong>Account information:</strong> Name, email address, job title, organization name, and password when you register.</li>
                <li><strong>Profile information:</strong> Department, skills, billing rate, and other professional details you choose to provide.</li>
                <li><strong>Client data:</strong> Information about your clients, contacts, and engagements that you enter into the Platform.</li>
                <li><strong>Audit and survey data:</strong> Responses, findings, evidence files, and reports you create or upload.</li>
                <li><strong>Financial data:</strong> Invoice details, payment terms, and time entries (we do not store payment card numbers).</li>
                <li><strong>Communications:</strong> Messages you send through the Platform's messaging or community features.</li>
              </ul>
            </SubSection>
            <SubSection title="2.2 Automatically Collected Information">
              <ul>
                <li><strong>Usage data:</strong> Pages visited, features used, actions taken, timestamps, and session duration.</li>
                <li><strong>Device information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
                <li><strong>Log data:</strong> Server logs including request paths, error codes, and referrer URLs.</li>
              </ul>
            </SubSection>
            <SubSection title="2.3 Information from Third Parties">
              <ul>
                <li><strong>Authentication providers:</strong> If you sign in via Clerk, we receive your email and basic profile data.</li>
                <li><strong>Integration partners:</strong> When you connect services (e.g., Microsoft 365, Wave Accounting, Typeform), we receive data you authorize those services to share.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <ul>
              <li>Provide, operate, and improve the Platform and its features.</li>
              <li>Authenticate your identity and manage your account.</li>
              <li>Process and display audit data, findings, and reports within your organization.</li>
              <li>Send transactional emails (account invitations, password resets, notification digests).</li>
              <li>Respond to support requests and communicate service updates.</li>
              <li>Analyze usage patterns to improve Platform performance and user experience.</li>
              <li>Detect and prevent fraud, abuse, and security incidents.</li>
              <li>Comply with applicable laws and regulations.</li>
            </ul>
          </Section>

          <Section title="4. How We Share Your Information">
            <p>We do <strong>not</strong> sell your personal information. We may share it only as follows:</p>
            <ul>
              <li><strong>Within your organization:</strong> Users and administrators in your organization can view data you create on the Platform according to their role permissions.</li>
              <li><strong>Service providers:</strong> We use trusted third-party vendors to operate the Platform (see Section 7). These vendors process data only on our behalf under strict data processing agreements.</li>
              <li><strong>Legal requirements:</strong> We may disclose information when required by law, court order, or to protect the rights, property, or safety of {COMPANY}, our users, or others.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your data is subject to a materially different privacy policy.</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your data for as long as your account is active and for a reasonable period thereafter to
              comply with legal obligations, resolve disputes, and enforce our agreements. When you request deletion
              of your account, we will permanently delete your personal data within 30 days, except where retention
              is required by law.
            </p>
          </Section>

          <Section title="6. Security">
            <p>
              We implement industry-standard security measures including TLS encryption in transit, AES-256
              encryption at rest, role-based access controls, and regular security reviews. However, no method of
              transmission or storage is 100% secure. You are responsible for maintaining the confidentiality of
              your account credentials.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>The Platform relies on the following sub-processors, each subject to their own privacy policies:</p>
            <table className="w-full border-collapse text-sm mt-4">
              <thead>
                <tr className="border-b border-[#1A1A1B]/10">
                  <th className="text-left py-2 font-semibold">Provider</th>
                  <th className="text-left py-2 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1B]/8">
                {[
                  ["Clerk",    "User authentication and identity management"],
                  ["Neon",     "PostgreSQL database hosting"],
                  ["Netlify",  "Platform hosting, serverless compute, CDN, and file storage"],
                  ["OpenAI","AI-powered analysis, briefings, and content generation"],
                  ["Resend",   "Transactional email delivery"],
                ].map(([p, pur]) => (
                  <tr key={p}>
                    <td className="py-2 font-medium">{p}</td>
                    <td className="py-2 text-[#708090]">{pur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong>Portability:</strong> Request an export of your data in a machine-readable format.</li>
              <li><strong>Objection / Restriction:</strong> Object to or request restriction of certain processing activities.</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on your consent, you may withdraw it at any time.</li>
            </ul>
            <p>
              To exercise these rights, email us at <a href={`mailto:${EMAIL}`} className="text-[#A0522D] underline">{EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="9. California Privacy Rights (CCPA)">
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) grants you specific
              rights, including the right to know what personal information we collect, the right to delete
              personal information, and the right to opt-out of the sale of personal information. We do not sell
              personal information. To exercise your CCPA rights, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#A0522D] underline">{EMAIL}</a>.
            </p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              The Platform is not directed to children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us with personal
              information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="11. International Data Transfers">
            <p>
              {COMPANY} is based in the United States. If you access the Platform from outside the United States,
              your information may be transferred to and processed in the United States, where data protection
              laws may differ from those in your jurisdiction. By using the Platform, you consent to this transfer.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the new policy on this page and updating the effective date. Continued use of the Platform
              after changes are posted constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <address className="not-italic mt-3 bg-white border border-[#1A1A1B]/10 rounded-xl p-5 text-sm">
              <strong>{COMPANY}</strong><br />
              Email:{" "}<a href={`mailto:${EMAIL}`} className="text-[#A0522D] underline">{EMAIL}</a><br />
              Platform:{" "}<a href="https://wvwconsulting.com" className="text-[#A0522D] underline">wvwconsulting.com</a>
            </address>
          </Section>
        </div>
      </main>

      <footer className="border-t border-[#1A1A1B]/10 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#708090]">
          <span>© 2026 {COMPANY}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#1A1A1B] transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-[#1A1A1B] transition-colors">Terms of Service</Link>
            <Link href="/"        className="hover:text-[#1A1A1B] transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-3 pb-2 border-b border-[#1A1A1B]/10">{title}</h2>
      <div className="space-y-3 text-[#1A1A1B]/80 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
