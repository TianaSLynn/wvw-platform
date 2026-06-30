import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — WVW Intelligence",
  description: "Terms governing your use of the WVW Intelligence platform.",
};

const EFFECTIVE_DATE = "May 18, 2026";
const COMPANY        = "Wholistic Vibes Wellness, LLC";
const EMAIL          = "legal@wvwconsulting.com";
const SITE           = "WVW Intelligence";

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-[#708090] text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-8 text-[#1A1A1B]">
          <Section title="1. Acceptance of Terms">
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and{" "}
              {COMPANY} ("Company," "we," "our," or "us") governing your access to and use of the {SITE}
              platform, including all software, services, content, and features offered through
              app.wvwconsulting.com and associated domains (collectively, the "Platform").
            </p>
            <p>
              By creating an account, clicking "Get Started," or otherwise using the Platform, you confirm that
              you have read, understood, and agree to be bound by these Terms and our{" "}
              <Link href="/privacy" className="text-[#A0522D] underline">Privacy Policy</Link>. If you are
              using the Platform on behalf of an organization, you represent that you have authority to bind
              that organization to these Terms.
            </p>
            <p>
              If you do not agree to these Terms, do not access or use the Platform.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              {SITE} is a professional services intelligence platform that provides audit management, training
              delivery, client portal access, workforce analytics, invoicing, and related business tools
              designed for wellness consultants and organizational practitioners. The Platform is offered on
              a subscription or access-fee basis as further described in your order or registration.
            </p>
          </Section>

          <Section title="3. Accounts and Access">
            <ul>
              <li><strong>Eligibility:</strong> You must be at least 18 years old and have the legal capacity to enter into these Terms.</li>
              <li><strong>Account creation:</strong> You agree to provide accurate, current, and complete information during registration and to keep it updated.</li>
              <li><strong>Credentials:</strong> You are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activity that occurs under your account.</li>
              <li><strong>Unauthorized access:</strong> Notify us immediately at {EMAIL} if you suspect unauthorized use of your account.</li>
              <li><strong>One account per person:</strong> Each individual user must have their own account. Sharing accounts is prohibited.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul>
              <li>Upload or transmit content that is unlawful, defamatory, obscene, fraudulent, or harmful.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform or its underlying infrastructure.</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the Platform.</li>
              <li>Use the Platform to transmit spam, malware, or other harmful code.</li>
              <li>Scrape, crawl, or extract data from the Platform using automated means without our prior written consent.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              <li>Use the Platform in any way that violates applicable local, national, or international law or regulation.</li>
            </ul>
          </Section>

          <Section title="5. Your Content">
            <p>
              "Your Content" means all data, files, text, and information you upload, submit, or create on the
              Platform, including client records, audit findings, survey responses, and evidence files.
            </p>
            <ul>
              <li><strong>Ownership:</strong> You retain all ownership rights in Your Content. We do not claim ownership of it.</li>
              <li><strong>License to us:</strong> You grant {COMPANY} a limited, non-exclusive license to store, process, and display Your Content solely to provide the Platform services to you.</li>
              <li><strong>Responsibility:</strong> You are solely responsible for the accuracy, legality, and appropriateness of Your Content. We are not responsible for any third-party data you enter.</li>
              <li><strong>Backup:</strong> While we maintain backups, you are responsible for maintaining your own copies of critical data.</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              The Platform, including its software, user interface, graphics, logos, and all related content
              created by {COMPANY}, is protected by copyright, trademark, and other intellectual property laws.
              {COMPANY} retains all rights, title, and interest in and to the Platform.
            </p>
            <p>
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive,
              non-transferable, revocable license to use the Platform for your internal business purposes only.
              This license does not include the right to sublicense, modify, create derivative works from, or
              commercially exploit the Platform.
            </p>
          </Section>

          <Section title="7. Confidentiality">
            <p>
              Each party agrees to maintain the confidentiality of the other party's non-public information
              and to use it only as necessary to fulfill obligations under these Terms. This obligation does
              not apply to information that is publicly available, independently developed, or required to be
              disclosed by law.
            </p>
          </Section>

          <Section title="8. Fees and Payment">
            <p>
              Fees for the Platform are set forth in your subscription agreement or at the time of sign-up.
              Unless otherwise stated:
            </p>
            <ul>
              <li>Fees are billed in advance on a monthly or annual basis.</li>
              <li>All fees are non-refundable except as expressly stated in a written agreement or required by applicable law.</li>
              <li>We reserve the right to change our pricing upon 30 days' written notice.</li>
              <li>Failure to pay fees may result in suspension or termination of your account.</li>
            </ul>
          </Section>

          <Section title="9. Term and Termination">
            <p>
              These Terms remain in effect as long as you use the Platform. Either party may terminate these
              Terms at any time. We may suspend or terminate your access immediately if you breach these Terms
              or engage in conduct we deem harmful to the Platform or other users.
            </p>
            <p>
              Upon termination, your right to access the Platform ceases. You may request an export of Your
              Content within 30 days of termination, after which we may delete it in accordance with our
              data retention policy.
            </p>
          </Section>

          <Section title="10. Disclaimers">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p>
              {SITE} is a business operations tool, not a licensed medical, legal, or financial advisory
              service. Nothing on the Platform constitutes professional advice. You should consult qualified
              professionals for advice specific to your situation.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY.toUpperCase()},
              ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT
              OF OR RELATED TO YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM
              SHALL NOT EXCEED THE GREATER OF (A) THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM
              OR (B) ONE HUNDRED US DOLLARS ($100).
            </p>
          </Section>

          <Section title="12. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless {COMPANY} and its officers, directors,
              employees, and agents from and against any claims, damages, losses, costs, and expenses
              (including reasonable attorney's fees) arising from (a) your use of the Platform, (b) Your
              Content, (c) your breach of these Terms, or (d) your violation of any applicable law.
            </p>
          </Section>

          <Section title="13. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by the laws of the United States and the state of incorporation of
              {COMPANY}, without regard to conflict of law principles. Any dispute arising under these Terms
              shall first be submitted to good-faith negotiation. If unresolved after 30 days, disputes shall
              be submitted to binding arbitration under the American Arbitration Association's Commercial
              Arbitration Rules. You waive any right to a class action or jury trial.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. We will provide at least 14 days'
              notice of material changes by email or by posting a notice on the Platform. Your continued use
              of the Platform after the effective date of the revised Terms constitutes your acceptance.
            </p>
          </Section>

          <Section title="15. General Provisions">
            <ul>
              <li><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and {COMPANY} regarding the Platform.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions remain in full force.</li>
              <li><strong>Waiver:</strong> Failure to enforce any provision shall not constitute a waiver of future enforcement.</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our written consent. We may assign our rights in connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>Force majeure:</strong> Neither party shall be liable for failure to perform due to causes beyond their reasonable control.</li>
            </ul>
          </Section>

          <Section title="16. Contact">
            <p>For legal questions regarding these Terms, contact us at:</p>
            <address className="not-italic mt-3 bg-white border border-[#1A1A1B]/10 rounded-xl p-5 text-sm">
              <strong>{COMPANY}</strong><br />
              Legal inquiries:{" "}<a href={`mailto:${EMAIL}`} className="text-[#A0522D] underline">{EMAIL}</a>
            </address>
          </Section>
        </div>
      </main>

      <footer className="border-t border-[#1A1A1B]/10 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#708090]">
          <span>© 2026 {COMPANY}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#1A1A1B] transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-[#1A1A1B] transition-colors font-medium">Terms of Service</Link>
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
