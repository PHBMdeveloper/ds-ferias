import { prisma } from "@/lib/prisma";

const baseInclude = {
  manager: {
    select: {
      id: true,
      name: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    },
  },
  vacationRequests: {
    orderBy: { startDate: "asc" as const },
    include: {
      history: {
        orderBy: { changedAt: "asc" as const },
        include: { changedByUser: { select: { name: true, role: true } } },
      },
    },
  },
} as const;

export async function findUserWithBalance(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      hireDate: true,
      department: true,
      vacationRequests: {
        select: { startDate: true, endDate: true, status: true },
      },
    },
  });
}

export async function findUserDepartment(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { department: true },
  });
  return u?.department ?? null;
}

export async function findTeamMembersByManager(managerId: string) {
  return prisma.user.findMany({
    where: { managerId },
    include: baseInclude,
  });
}

export async function findTeamMembersByGerente(gerenteId: string) {
  return prisma.user.findMany({
    where: { manager: { managerId: gerenteId } },
    include: baseInclude,
  });
}

export async function findAllEmployees() {
  return prisma.user.findMany({
    where: { role: { in: ["FUNCIONARIO", "COLABORADOR"] } },
    include: baseInclude,
  });
}

export async function findAllUsersForAdmin() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      registration: true,
      department: true,
      hireDate: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      _count: { select: { reports: true } },
    },
  });
}

export async function findManagersForAdmin() {
  return prisma.user.findMany({
    where: { role: { in: ["COORDENADOR", "GERENTE", "GESTOR"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function findUsersWithVacationForBalance() {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      hireDate: true,
      vacationRequests: {
        select: { startDate: true, endDate: true, status: true },
      },
    },
  });
}
