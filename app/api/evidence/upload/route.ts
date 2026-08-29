import { getCurrentUser } from "@/lib/auth";
import { unauthorized, created, badRequest, serverError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { uploadFile } from "@/lib/storage";
import { createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const formData = await req.formData();
    const auditId      = formData.get("auditId") as string;
    const findingId    = formData.get("findingId") as string | null;
    const checklistItemId = formData.get("checklistItemId") as string | null;
    const title        = formData.get("title") as string;
    const description  = formData.get("description") as string | null;
    const type         = (formData.get("type") as string) ?? "FILE";
    const externalUrl  = formData.get("externalUrl") as string | null;
    const noteContent  = formData.get("noteContent") as string | null;
    const file         = formData.get("file") as File | null;

    if (!auditId || !title) return badRequest("auditId and title are required");

    // Verify audit belongs to org
    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return badRequest("Audit not found");

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;
    let sha256Hash: string | null = null;

    // Handle file upload
    if (file && file.size > 0) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) return badRequest("File exceeds 50MB limit");

      // MIME type allowlist — reject executable/scriptable formats
      const ALLOWED_TYPES = new Set([
        "application/pdf",
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff",
        "text/plain", "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip", "application/x-zip-compressed",
        "video/mp4", "video/webm",
        "audio/mpeg", "audio/wav",
      ]);
      if (!ALLOWED_TYPES.has(file.type)) {
        return badRequest(`File type "${file.type}" is not allowed`);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Compute SHA-256 for tamper detection
      sha256Hash = createHash("sha256").update(buffer).digest("hex");

      fileName  = file.name;
      fileSize  = file.size;
      mimeType  = file.type;

      // Upload must complete before the evidence record is created. Production
      // storage failures fail closed so the UI never reports a missing file as saved.
      const result = await uploadFile(buffer, file.name, file.type, `evidence/${auditId}`);
      fileUrl = result.url;
    }

    const evidence = await db.evidence.create({
      data: {
        auditId,
        uploadedById: user.id,
        findingId:    findingId || null,
        checklistItemId: checklistItemId || null,
        type:         type as never,
        title,
        description:  description || null,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        externalUrl:  externalUrl || null,
        snapshotData: noteContent ? { content: noteContent } : undefined,
        sha256Hash,
        collectedAt: new Date(),
      },
    });

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      action: "audit.evidence.uploaded",
      entityType: "Evidence",
      entityId: evidence.id,
      entityLabel: title,
      auditId,
      clientId: audit.clientId,
      metadata: { type, fileName, fileSize },
    });

    return created(evidence);
  } catch (e) {
    return serverError(e);
  }
}
