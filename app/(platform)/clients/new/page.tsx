import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import NewClientForm from "./NewClientForm";

export const metadata: Metadata = { title: "New Client" };

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Client</h1>
        <p className="page-subtitle mt-0.5">Add a new client to your organization</p>
      </div>
      <NewClientForm />
    </div>
  );
}
