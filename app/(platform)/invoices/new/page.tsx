import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import NewInvoiceForm from "./NewInvoiceForm";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const user = await requireUser();

  const [clients, projects] = await Promise.all([
    db.client.findMany({
      where: { orgId: user.orgId, isActive: true, deletedAt: null },
      select: { id: true, name: true, defaultRate: true, paymentTerms: true },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      where: { orgId: user.orgId, deletedAt: null, status: { in: ["ACTIVE","PLANNING","DISCOVERY"] } },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Invoice</h1>
        <p className="page-subtitle mt-0.5">Create and send a professional invoice to your client</p>
      </div>
      <NewInvoiceForm clients={clients} projects={projects} />
    </div>
  );
}
