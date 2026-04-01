import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida no .env");
}

const adapter = new PrismaPg({ connectionString });

// Criamos o cliente com logs de eventos ativos para interceptar
export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

// Redireciona logs do Prisma para o nosso logger estruturado
if (!(prisma as any)._loggingInitialized) {
  (prisma as any).$on("query", (e: any) => {
    // Logamos queries apenas se durarem mais de 1500ms (slow queries)
    if (e.duration >= 1500) {
      logger.warn("Slow query detected", { 
        query: e.query, 
        params: e.params, 
        duration: e.duration 
      });
    }
  });

  (prisma as any).$on("error", (e: any) => {
    logger.error("Prisma error", { error: e });
  });

  (prisma as any).$on("warn", (e: any) => {
    logger.warn("Prisma warning", { message: e.message });
  });

  (prisma as any)._loggingInitialized = true;
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
