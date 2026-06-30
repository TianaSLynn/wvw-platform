import { PrismaClient } from "@prisma/client";
import { runIntegrationTest } from "../lib/integration-testers";

const db = new PrismaClient();

async function main() {
  const integrations = await db.integration.findMany({
    select: { id: true, name: true, slug: true, config: true },
  });

  console.log(`Verifying ${integrations.length} connected integrations...\n`);

  for (const intg of integrations) {
    const config = (intg.config ?? {}) as Record<string, string>;
    const result = await runIntegrationTest(intg.slug, config);

    await db.integration.update({
      where: { id: intg.id },
      data: {
        status: result.ok ? "ACTIVE" : "ERROR",
        lastSyncAt: new Date(),
        lastSyncStatus: result.message,
      },
    });

    const icon = result.ok ? "✓" : "✗";
    console.log(`${icon} ${intg.name} (${intg.slug})`);
    console.log(`   ${result.message}\n`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
