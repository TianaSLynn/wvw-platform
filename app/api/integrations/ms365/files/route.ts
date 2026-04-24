/**
 * GET  /api/integrations/ms365/files?type=onedrive&folderId=...
 *      /api/integrations/ms365/files?type=sharepoint&siteId=...&folderId=...
 *
 * Returns a list of files/folders from OneDrive or SharePoint.
 * Requires the org to have an active microsoft-365 integration.
 */
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getMS365Config, getGraphToken, listOneDriveFiles, listSharePointFiles, listSharePointSites } from "@/lib/ms365";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type     = searchParams.get("type") ?? "onedrive"; // "onedrive" | "sharepoint" | "sites"
    const folderId = searchParams.get("folderId") ?? undefined;
    const siteId   = searchParams.get("siteId")   ?? undefined;

    const cfg = await getMS365Config(user.orgId);
    if (!cfg) {
      return badRequest("Microsoft 365 integration is not connected. Go to Settings → Integrations to configure it.");
    }

    const token = await getGraphToken(cfg);

    if (type === "sites") {
      const sites = await listSharePointSites(token);
      return ok({ type: "sites", items: sites });
    }

    if (type === "sharepoint") {
      if (!siteId) return badRequest("siteId is required for SharePoint browsing");
      const files = await listSharePointFiles(token, siteId, folderId);
      return ok({ type: "sharepoint", siteId, folderId, items: files });
    }

    // Default: OneDrive
    const files = await listOneDriveFiles(token, folderId);
    return ok({ type: "onedrive", folderId, items: files });
  } catch (e) {
    return serverError(e);
  }
}
