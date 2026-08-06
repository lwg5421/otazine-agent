import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; schemaReady?: Promise<void> };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Vercel의 "Sensitive" 환경변수는 빌드 시점엔 노출되지 않아 `prisma db push`를
// 빌드 스크립트에서 실행할 수 없다. 대신 런타임(요청 처리 시점, 실제 DB URL이
// 주입된 상태)에 테이블을 한 번만 생성한다.
export function ensureSchema(): Promise<void> {
  if (!globalForPrisma.schemaReady) {
    globalForPrisma.schemaReady = prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PipelineItem" (
        "id" TEXT PRIMARY KEY,
        "news" JSONB NOT NULL,
        "status" TEXT NOT NULL,
        "draft" TEXT,
        "editedDraft" TEXT,
        "approved" BOOLEAN,
        "score" INTEGER,
        "summary" TEXT,
        "confirmRaw" TEXT,
        "startedAt" TEXT NOT NULL,
        "finishedAt" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => undefined);
  }
  return globalForPrisma.schemaReady;
}
