/**
 * Unified file storage — uses Vercel Blob in production when BLOB_READ_WRITE_TOKEN is set,
 * falls back to local filesystem storage for development/self-hosted environments.
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export type StorageResult = {
  url: string;
  storageType: "blob" | "local";
};

const LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads");

async function ensureLocalDir(subDir: string) {
  const dir = join(LOCAL_UPLOAD_DIR, subDir);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string
): Promise<StorageResult> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // ── Vercel Blob (production) ──────────────────────────────────────────────
  if (blobToken) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`${folder}/${Date.now()}-${sanitizeFilename(filename)}`, buffer, {
        access: "private",
        token: blobToken,
        contentType: mimeType,
      });
      return { url: blob.url, storageType: "blob" };
    } catch (err) {
      console.error("[storage] Vercel Blob upload failed, falling back to local:", err);
    }
  }

  // ── Local filesystem fallback ─────────────────────────────────────────────
  const dir      = await ensureLocalDir(folder);
  const safeName = `${Date.now()}-${sanitizeFilename(filename)}`;
  const filePath = join(dir, safeName);
  await writeFile(filePath, buffer);
  const url = `/uploads/${folder}/${safeName}`;
  return { url, storageType: "local" };
}

export function getStorageMode(): "blob" | "local" {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}
