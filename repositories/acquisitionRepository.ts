import { prisma } from "@/lib/prisma";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Ajusta quando o mês alvo não tiver o mesmo dia (ex.: 31 → 30)
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

function daysBetweenInclusiveClamped(start: Date, end: Date): number {
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const raw = Math.round((e.getTime() - s.getTime()) / ONE_DAY_MS) + 1;
  return Math.min(Math.max(1, raw), 30);
}

/**
 * Gera períodos aquisitivos de 12 meses para um usuário a partir da hireDate.
 * Se já existirem períodos, faz backfill de usedDays a partir de solicitações APROVADO_RH
 * que não tenham acquisitionPeriodId definido (vacações aprovadas antes desta feature).
 *
 * Hoje são gerados apenas os ciclos até a data atual, com 30 dias de direito cada.
 */
export async function syncAcquisitionPeriodsForUser(
  userId: string,
  hireDate: Date | null | undefined,
) {
  if (!hireDate) return [];

  // Em dev, pode acontecer de o Prisma Client ainda não ter sido regenerado após migrations.
  // Evita quebrar a aplicação e permite que o deploy/migrate finalize.
  const ap = (prisma as any)?.acquisitionPeriod;
  if (!ap?.findMany || !ap?.createMany) return [];

  const existing: Array<{ id: string; startDate: Date; endDate: Date; accruedDays: number; usedDays: number }> = await ap.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });

  if (existing.length === 0) {
    // Cria os períodos a partir da hireDate
    const periods: Array<{ userId: string; startDate: Date; endDate: Date; accruedDays: number; usedDays: number }> = [];
    const today = new Date();
    let start = new Date(hireDate);

    while (start < today) {
      const endExclusive = addMonths(start, 12);
      const end = new Date(endExclusive.getTime() - 1); // dia anterior ao próximo ciclo
      periods.push({
        userId,
        startDate: start,
        endDate: end,
        accruedDays: 30,
        usedDays: 0,
      });
      start = endExclusive;
    }

    if (periods.length > 0) {
      await ap.createMany({ data: periods });
    }
  }

  // Backfill: busca solicitações APROVADO_RH sem acquisitionPeriodId associado
  // e credita os dias nos períodos correspondentes.
  const orphanRequests: Array<{ id: string; startDate: Date; endDate: Date }> =
    await (prisma as any).vacationRequest.findMany({
      where: {
        userId,
        status: "APROVADO_RH",
        acquisitionPeriodId: null,
      },
      select: { id: true, startDate: true, endDate: true },
    });

  if (orphanRequests.length > 0) {
    const allPeriods: Array<{ id: string; startDate: Date; endDate: Date; accruedDays: number; usedDays: number }> = await ap.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
    });

    for (const req of orphanRequests) {
      const period = allPeriods.find(
        (p) => p.startDate <= req.startDate && p.endDate >= req.endDate,
      );
      if (!period) continue;

      const days = daysBetweenInclusiveClamped(req.startDate, req.endDate);
      // Atualiza o banco e o array local para evitar duplo-crédito em caso de múltiplos orphans no mesmo período
      const newUsedDays = Math.min(period.usedDays + days, period.accruedDays);
      await ap.update({
        where: { id: period.id },
        data: { usedDays: newUsedDays },
      });
      await (prisma as any).vacationRequest.update({
        where: { id: req.id },
        data: { acquisitionPeriodId: period.id },
      });
      period.usedDays = newUsedDays;
    }
  }

  return ap.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
}

export async function findAcquisitionPeriodsForUser(userId: string) {
  const ap = (prisma as any)?.acquisitionPeriod;
  if (!ap?.findMany) return [];
  return ap.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
}

export async function findAcquisitionPeriodForRange(
  userId: string,
  start: Date,
  end: Date,
) {
  const ap = (prisma as any)?.acquisitionPeriod;
  if (!ap?.findMany) return null;

  const periods = await ap.findMany({
    where: {
      userId,
      startDate: { lte: start },
      endDate: { gte: end },
    },
    orderBy: { startDate: "asc" },
  });
  return periods[0] ?? null;
}

export async function addUsedDaysForRequest(
  userId: string,
  start: Date,
  end: Date,
) {
  const period = await findAcquisitionPeriodForRange(userId, start, end);
  if (!period) return null;

  const days =
    Math.round(
      (end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) /
        (24 * 60 * 60 * 1000),
    ) + 1;

  const ap = (prisma as any)?.acquisitionPeriod;
  await ap.update({
    where: { id: period.id },
    data: { usedDays: period.usedDays + days },
  });

  return period;
}

