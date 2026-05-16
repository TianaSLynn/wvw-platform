import { ok, unauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { APP_VERSION, APP_VERSION_DATE, CHANGELOG } from "@/lib/app-version";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  return ok({
    version: APP_VERSION,
    releaseDate: APP_VERSION_DATE,
    changelog: CHANGELOG,
  });
}
