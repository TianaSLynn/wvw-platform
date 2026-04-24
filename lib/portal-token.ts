import { createHmac } from "crypto";

const SECRET = process.env.ENCRYPTION_KEY ?? "wvw-portal-secret-change-in-production";

export function generatePortalToken(clientId: string): string {
  const mac = createHmac("sha256", SECRET).update(clientId).digest("base64url");
  // token = base64url(clientId):mac  (clientId is cuid so safe in URL)
  return `${Buffer.from(clientId).toString("base64url")}.${mac}`;
}

export function verifyPortalToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const clientId = Buffer.from(parts[0]!, "base64url").toString("utf-8");
  const expected = createHmac("sha256", SECRET).update(clientId).digest("base64url");
  if (expected !== parts[1]) return null;
  return clientId;
}
