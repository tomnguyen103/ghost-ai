import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

// Replace deprecated SSL mode aliases with the explicit equivalent so pg
// doesn't emit a deprecation warning. Current behavior is verify-full for
// all three modes; this makes the intent explicit.
function normalizeUrl(url: string): string {
  return url.replace(/sslmode=(prefer|require|verify-ca)/, "sslmode=verify-full");
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeUrl(url) }) });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
