import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import EvidenceVaultClient from "./EvidenceVaultClient";

export const metadata: Metadata = { title: "Evidence Vault" };

export default async function EvidenceVaultPage() {
  const user = await requireUser();

  const [evidence, audits] = await Promise.all([
    db.evidence.findMany({
      where: { audit: { orgId: user.orgId } },
      include: {
        audit:      { select: { id: true, name: true, code: true, client: { select: { name: true } } } },
        uploadedBy: { select: { firstName: true, lastName: true } },
        finding:    { select: { findingNumber: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.audit.findMany({
      where: { orgId: user.orgId },
      select: { id: true, name: true, code: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const stats = {
    total:        evidence.length,
    files:        evidence.filter((e) => e.type === "FILE").length,
    links:        evidence.filter((e) => e.type === "LINK").length,
    screenshots:  evidence.filter((e) => e.type === "SCREENSHOT").length,
    notes:        evidence.filter((e) => e.type === "NOTE").length,
    totalBytes:   evidence.reduce((s, e) => s + (e.fileSize ?? 0), 0),
    hashed:       evidence.filter((e) => e.sha256Hash).length,
  };

  return <EvidenceVaultClient evidence={evidence} audits={audits} stats={stats} />;
}
