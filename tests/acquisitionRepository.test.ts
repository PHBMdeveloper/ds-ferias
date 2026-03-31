import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncAcquisitionPeriodsForUser } from "@/repositories/acquisitionRepository";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    acquisitionPeriod: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    vacationRequest: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("acquisitionRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when hireDate is missing", async () => {
    const res = await syncAcquisitionPeriodsForUser("u1", null);
    expect(res).toEqual([]);
  });

  it("performs dedup when duplicate periods exist", async () => {
    const start = new Date("2020-01-01");
    const end = new Date("2020-12-31");
    const mockPeriods = [
      { id: "p1", startDate: start, endDate: end, accruedDays: 30, usedDays: 10 },
      { id: "p2", startDate: start, endDate: end, accruedDays: 30, usedDays: 5 },
    ];
    
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue(mockPeriods as any);
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([]);

    await syncAcquisitionPeriodsForUser("u1", new Date("2020-01-01"));

    expect(prisma.vacationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { acquisitionPeriodId: "p1" } // Canonical is p1 (more usedDays)
    }));
    expect(prisma.acquisitionPeriod.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ["p2"] } }
    }));
  });

  it("keeps current/future periods (was: deletes unearned periods)", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const mockPeriods = [
      { id: "p-future", startDate: new Date(), endDate: futureDate, accruedDays: 30, usedDays: 0 }
    ];
    
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue(mockPeriods as any);
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([]);

    await syncAcquisitionPeriodsForUser("u1", new Date("2020-01-01"));

    // Agora NÃO deve deletar
    expect(prisma.acquisitionPeriod.deleteMany).not.toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["p-future"] } })
    }));
  });

  it("recalculates usedDays using FIFO logic across multiple periods", async () => {
    const p1 = { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2020-12-31"), accruedDays: 30, usedDays: 99 };
    const p2 = { id: "p2", startDate: new Date("2021-01-01"), endDate: new Date("2021-12-31"), accruedDays: 30, usedDays: 99 };

    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue([p1, p2] as any);

    // R1 consome 30 dias de p1. R2 consome 5 dias de p2.
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([
      { id: "r1", startDate: new Date("2022-01-01"), endDate: new Date("2022-01-30"), abono: false, status: "APROVADO_RH" },
      { id: "r2", startDate: new Date("2023-06-01"), endDate: new Date("2023-06-05"), abono: false, status: "APROVADO_RH" }
    ] as any);

    await syncAcquisitionPeriodsForUser("u1", new Date("2020-01-01"));

    expect(prisma.acquisitionPeriod.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "p1" },
      data: { usedDays: 30 }
    }));
    expect(prisma.acquisitionPeriod.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "p2" },
      data: { usedDays: 5 }
    }));
  });

  it("creates missing periods for new users", async () => {
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValueOnce([]); // No periods first
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue([
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2020-12-30"), accruedDays: 30, usedDays: 0 }
    ] as any); // Then returns one
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([]);

    const hire = new Date();
    hire.setFullYear(hire.getFullYear() - 2); // 2 full cycles
    await syncAcquisitionPeriodsForUser("u1", hire);

    expect(prisma.acquisitionPeriod.createMany).toHaveBeenCalled();
  });

  it("generates missing cycles incrementally if some already exist", async () => {
    const hire = new Date("2020-01-01");
    // Simula que só temos o primeiro ciclo no banco, mas já estamos em 2026
    const mockPeriods = [
      { id: "p1", startDate: hire, endDate: new Date("2020-12-31"), accruedDays: 30, usedDays: 0 }
    ];
    
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue(mockPeriods as any);
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([]);

    await syncAcquisitionPeriodsForUser("u1", hire);

    // Deve ter chamado o createMany para os ciclos de 2021, 2022, 2023, 2024, 2025 e o atual 2026
    expect(prisma.acquisitionPeriod.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ startDate: new Date("2021-01-01") })
      ])
    }));
  });

  it("resets and regenerates cycles if hireDate changes", async () => {
    const oldHire = new Date("2020-01-01");
    const newHire = new Date("2021-01-01");
    
    // Simula períodos existentes baseados na data antiga
    const mockPeriods = [
      { id: "p-old", startDate: oldHire, endDate: new Date("2020-12-31"), accruedDays: 30, usedDays: 0 }
    ];
    
    vi.mocked(prisma.acquisitionPeriod.findMany).mockResolvedValue(mockPeriods as any);
    vi.mocked(prisma.vacationRequest.findMany).mockResolvedValue([]);

    // Chama com a NOVA data
    await syncAcquisitionPeriodsForUser("u1", newHire);

    // Deve ter deletado os ciclos antigos do usuário u1
    expect(prisma.acquisitionPeriod.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1" }
    }));
    
    // Deve ter desvinculado as férias dos ciclos antigos
    expect(prisma.vacationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", acquisitionPeriodId: { not: null } },
      data: { acquisitionPeriodId: null }
    }));
  });

  it("handles missing prisma methods gracefully", async () => {
    const original = prisma.acquisitionPeriod;
    (prisma as any).acquisitionPeriod = {};
    const res = await syncAcquisitionPeriodsForUser("u1", new Date());
    expect(res).toEqual([]);
    (prisma as any).acquisitionPeriod = original;
  });
});
