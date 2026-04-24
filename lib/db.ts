import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
//  Singleton Prisma Client
//  Next.js hot-reload creates new module instances in dev, which would exhaust
//  the connection pool. This pattern prevents that.
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
