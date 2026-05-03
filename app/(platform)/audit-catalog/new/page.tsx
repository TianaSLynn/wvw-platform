import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import NewTemplateForm from "./NewTemplateForm";

export const metadata: Metadata = { title: "New Audit Template" };

export default async function NewTemplatePage() {
  await requireUser();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Audit Template</h1>
        <p className="page-subtitle mt-0.5">Define a reusable audit template for your organization</p>
      </div>
      <NewTemplateForm />
    </div>
  );
}
