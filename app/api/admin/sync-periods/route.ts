import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRoleLevel } from "@/lib/vacationRules";
import { prisma } from "@/lib/prisma";
import { syncAcquisitionPeriodsForUser } from "@/repositories/acquisitionRepository";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/sync-periods
 * 1. Migra registros legados APROVADO_RH → APROVADO_DIRETOR (status removido do fluxo).
 * 2. Recalcula os usedDays de todos os períodos aquisitivos via FIFO.
 * Acesso restrito a RH.
 */
export async function POST() {
  const actor = await getSessionUser();
  if (!actor || getRoleLevel(actor.role) < 5) {
    return NextResponse.json({ error: "Acesso restrito ao RH." }, { status: 403 });
  }

  // Migra registros legados com status APROVADO_RH → APROVADO_DIRETOR
  const [migratedRequests, migratedHistoryPrev, migratedHistoryNew] = await Promise.all([
    prisma.$executeRaw`UPDATE "VacationRequest" SET status = 'APROVADO_DIRETOR'::"VacationStatus" WHERE status = 'APROVADO_RH'::"VacationStatus"`,
    prisma.$executeRaw`UPDATE "VacationRequestHistory" SET "previousStatus" = 'APROVADO_DIRETOR'::"VacationStatus" WHERE "previousStatus" = 'APROVADO_RH'::"VacationStatus"`,
    prisma.$executeRaw`UPDATE "VacationRequestHistory" SET "newStatus" = 'APROVADO_DIRETOR'::"VacationStatus" WHERE "newStatus" = 'APROVADO_RH'::"VacationStatus"`,
  ]);

  if (migratedRequests > 0) {
    logger.info("Migração APROVADO_RH → APROVADO_DIRETOR concluída", {
      requests: migratedRequests,
      historyPrev: migratedHistoryPrev,
      historyNew: migratedHistoryNew,
      actorId: actor.id,
    });
  }

  const users = await prisma.user.findMany({
    where: { hireDate: { not: null } },
    select: { id: true, name: true, hireDate: true },
  });

  let synced = 0;
  let failed = 0;
  const errors: { userId: string; name: string; error: string }[] = [];

  for (const user of users) {
    try {
      await syncAcquisitionPeriodsForUser(user.id, user.hireDate);
      synced++;
    } catch (err) {
      failed++;
      errors.push({ userId: user.id, name: user.name, error: String(err) });
      logger.error("Erro ao sincronizar períodos do usuário", { userId: user.id, error: String(err) });
    }
  }

  logger.info("Resync de períodos aquisitivos concluído", { synced, failed, actorId: actor.id });

  return NextResponse.json({
    ok: true,
    migratedLegacyRH: Number(migratedRequests),
    synced,
    failed,
    errors,
  });
}
