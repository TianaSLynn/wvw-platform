/**
 * Unified file storage. Netlify deployments use site-scoped Netlify Blobs;
 * other production hosts may use Vercel Blob when configured. Local filesystem
 * storage is development-only because serverless filesystems are not durable.
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export type StorageResult = {
  url: string;
  storageType: "netlify-blobs" | "vercel-blob" | "local";
};

const NETLIFY_STORE_NAME = "wvw-evidence";
const NETLIFY_POINTER_PREFIX = "netlify-blob://";

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
  const objectKey = `${folder}/${Date.now()}-${sanitizeFilename(filename)}`;

  // ── Netlify Blobs (production) ────────────────────────────────────────────
  if (process.env.NETLIFY === "true") {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(NETLIFY_STORE_NAME, { consistency: "strong" });
    await store.set(objectKey, Uint8Array.from(buffer).buffer);
    return { url: `${NETLIFY_POINTER_PREFIX}${objectKey}`, storageType: "netlify-blobs" };
  }

  // ── Vercel Blob (alternate production host) ───────────────────────────────
  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const blob = await put(objectKey, buffer, {
      access: "private",
      token: blobToken,
      contentType: mimeType,
    });
    return { url: blob.url, storageType: "vercel-blob" };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Durable evidence storage is not configured for this production host.");
  }

  // ── Local filesystem fallback ─────────────────────────────────────────────
  const dir      = await ensureLocalDir(folder);
  const safeName = `${Date.now()}-${sanitizeFilename(filename)}`;
  const filePath = join(dir, safeName);
  await writeFile(filePath, buffer);
  const url = `/uploads/${folder}/${safeName}`;
  return { url, storageType: "local" };
}

export function getStorageMode(): StorageResult["storageType"] {
  if (process.env.NETLIFY === "true") return "netlify-blobs";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  return "local";
}

export function getNetlifyBlobKey(pointer: string): string | null {
  return pointer.startsWith(NETLIFY_POINTER_PREFIX)
    ? pointer.slice(NETLIFY_POINTER_PREFIX.length)
    : null;
}

export async function readNetlifyBlob(key: string): Promise<ArrayBuffer | null> {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore(NETLIFY_STORE_NAME, { consistency: "strong" });
  return store.get(key, { type: "arrayBuffer" });
}
