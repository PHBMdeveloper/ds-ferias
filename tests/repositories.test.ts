import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vacationRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockResolvedValue({}),
    },
    acquisitionPeriod: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    blackoutPeriod: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "postgresql://localhost:5432/test";

import {
  findMyRequests,
  findManagedRequests,
} from "@/repositories/vacationRepository";
import { syncAcquisitionPeriodsForUser } from "@/repositories/acquisitionRepository";
import { findBlackouts } from "@/repositories/blackoutRepository";
import {
  findUserWithBalance,
  findUserDepartment,
  findTeamMembersByManager,
  findTeamMembersByGerente,
  findAllEmployees,
  findAllUsersForAdmin,
  findManagersForAdmin,
} from "@/repositories/userRepository";

describe("vacationRepository", () => {
  it("findMyRequests calls prisma with userId", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findMyRequests("user-1");
    expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("findManagedRequests calls prisma with where", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findManagedRequests({ status: "PENDENTE" });
    expect(prisma.vacationRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDENTE" } })
    );
  });
});

describe("acquisitionRepository", () => {
  it("returns [] when hireDate is null/undefined", async () => {
    expect(await syncAcquisitionPeriodsForUser("u1", null)).toEqual([]);
    expect(await syncAcquisitionPeriodsForUser("u1", undefined)).toEqual([]);
  });

  it("returns [] when prisma client has no acquisitionPeriod (safety fallback)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const original = (prisma as any).acquisitionPeriod;
    (prisma as any).acquisitionPeriod = undefined;
    try {
      const out = await syncAcquisitionPeriodsForUser("u1", new Date("2025-01-01T12:00:00Z"));
      expect(out).toEqual([]);
    } finally {
      (prisma as any).acquisitionPeriod = original;
    }
  });

  it("returns existing periods if already present", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked((prisma as any).acquisitionPeriod.findMany).mockResolvedValueOnce([
      { id: "p1", userId: "u1", startDate: new Date("2023-01-01"), endDate: new Date("2023-12-31"), accruedDays: 30, usedDays: 0 },
    ]);
    const out = await syncAcquisitionPeriodsForUser("u1", new Date("2024-01-01T12:00:00Z"));
    expect(out).toHaveLength(1);
    expect((prisma as any).acquisitionPeriod.createMany).not.toHaveBeenCalled();
  });

  it("creates periods when none exist and returns them", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

    // first call: no existing
    vi.mocked((prisma as any).acquisitionPeriod.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "p1", userId: "u1" },
        { id: "p2", userId: "u1" },
      ] as any);

    await syncAcquisitionPeriodsForUser("u1", new Date("2024-01-10T12:00:00Z"));

    expect((prisma as any).acquisitionPeriod.createMany).toHaveBeenCalledTimes(1);
    const arg = vi.mocked((prisma as any).acquisitionPeriod.createMany).mock.calls[0][0];
    expect(Array.isArray(arg.data)).toBe(true);
    expect(arg.data.length).toBeGreaterThan(0);
    expect(arg.data[0].userId).toBe("u1");

    vi.useRealTimers();
  });
});

describe("blackoutRepository", () => {
  it("findBlackouts returns list from prisma", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.blackoutPeriod.findMany).mockResolvedValueOnce([
      { id: "b1", startDate: new Date(), endDate: new Date(), reason: "Fechamento", department: null, createdById: "u1", createdBy: { name: "Admin" } } as never,
    ]);
    const list = await findBlackouts();
    expect(list).toHaveLength(1);
    expect(list[0].reason).toBe("Fechamento");
  });
});

describe("userRepository", () => {
  it("findUserWithBalance calls prisma with userId", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findUserWithBalance("user-1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
  });

  it("findUserDepartment returns department or null", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ department: "TI" } as never);
    const dept = await findUserDepartment("user-1");
    expect(dept).toBe("TI");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    expect(await findUserDepartment("user-2")).toBeNull();
  });

  it("findTeamMembersByManager calls prisma with managerId", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findTeamMembersByManager("coord-1");
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { managerId: "coord-1" } })
    );
  });

  it("findTeamMembersByGerente calls prisma with manager.managerId", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findTeamMembersByGerente("ger-1");
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { manager: { managerId: "ger-1" } } })
    );
  });

  it("findAllEmployees calls prisma with role filter", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findAllEmployees();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: { in: ["FUNCIONARIO", "COLABORADOR"] } } })
    );
  });

  it("findAllUsersForAdmin chama prisma com ordenação e seleção de campos esperados", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findAllUsersForAdmin();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
          registration: true,
          department: true,
          manager: { select: { id: true, name: true } },
        }),
      })
    );
  });

  it("findManagersForAdmin chama prisma filtrando apenas coordenadores/gerentes/gestores", async () => {
    const { prisma } = await import("@/lib/prisma");
    await findManagersForAdmin();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: { in: ["COORDENADOR", "GERENTE", "GESTOR"] } },
        select: { id: true, name: true },
      })
    );
  });
});
