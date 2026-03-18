import { prisma } from "@/lib/prisma";

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

/**
 * Gera períodos aquisitivos de 12 meses para um usuário a partir da hireDate.
 * A função é idempotente: se já existirem períodos, apenas os retorna.
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

  const existing = await ap.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
  if (existing.length > 0) return existing;

  const periods = [];
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

