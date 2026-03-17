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

  const existing = await prisma.acquisitionPeriod.findMany({
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
    await prisma.acquisitionPeriod.createMany({ data: periods });
  }

  return prisma.acquisitionPeriod.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
}

