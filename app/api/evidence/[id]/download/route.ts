import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/api-response";
import { getNetlifyBlobKey, readNetlifyBlob } from "@/lib/storage";

function safeDownloadName(value: string | null): string {
  return (value || "evidence-file").replace(/[\r\n"\\]/g, "_").slice(0, 200);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const evidence = await db.evidence.findFirst({
      where: { id, audit: { orgId: user.orgId } },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });
    if (!evidence?.fileUrl) return notFound("Evidence file");

    const blobKey = getNetlifyBlobKey(evidence.fileUrl);
    if (blobKey) {
      const data = await readNetlifyBlob(blobKey);
      if (!data) return notFound("Evidence file");
      return new Response(data, {
        headers: {
          "Content-Type": evidence.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${safeDownloadName(evidence.fileName)}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (evidence.fileUrl.startsWith("/uploads/")) {
      return Response.redirect(new URL(evidence.fileUrl, req.url));
    }

    const external = new URL(evidence.fileUrl);
    if (!["https:", "http:"].includes(external.protocol)) return notFound("Evidence file");
    return Response.redirect(external);
  } catch (error) {
    return serverError(error);
  }
}
