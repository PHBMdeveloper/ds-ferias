import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncAcquisitionPeriodsForUser } from "@/repositories/acquisitionRepository";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    acquisitionPeriod: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    vacationRequest: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Bypass de tipagem (prisma as any)
(prisma as any).acquisitionPeriod = prisma.acquisitionPeriod;
(prisma as any).vacationRequest = prisma.vacationRequest;

const apMock = prisma.acquisitionPeriod;
const vrMock = prisma.vacationRequest;

describe("acquisitionRepository - Cenários Estendidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reseta todos os períodos se o primeiro ciclo não bater com a hireDate (mudança drástica de admissão)", async () => {
    const hireDate = new Date("2020-01-01");
    const existing = [{ id: "ap-old", startDate: new Date("2019-01-01"), endDate: new Date("2019-12-31") }];
    
    vi.mocked(apMock.findMany).mockResolvedValueOnce(existing as any).mockResolvedValue([]);
    vi.mocked(vrMock.findMany).mockResolvedValue([]);
    vi.mocked(vrMock.updateMany).mockResolvedValue({ count: 1 });

    await syncAcquisitionPeriodsForUser("u1", hireDate);

    expect(apMock.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(vrMock.updateMany).toHaveBeenCalled();
    expect(apMock.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ startDate: hireDate })
      ])
    });
  });

  it("recalcula usedDays via FIFO a partir de solicitações aprovadas", async () => {
    const hireDate = new Date("2022-01-01");
    // Dois ciclos criados com saldo 'sujo' (ex: 5 e 5) para forçar o update ao recalcular FIFO
    const periods = [
      { id: "ap1", startDate: new Date("2022-01-01"), endDate: new Date("2022-12-31"), accruedDays: 30, usedDays: 5 },
      { id: "ap2", startDate: new Date("2023-01-01"), endDate: new Date("2023-12-31"), accruedDays: 30, usedDays: 5 },
    ];
    
    // Solicitações que somam 40 dias
    const requests = [
      { id: "r1", startDate: new Date("2022-06-01"), endDate: new Date("2022-06-20"), status: "APROVADO_RH", abono: false }, // 20 dias
      { id: "r2", startDate: new Date("2023-02-01"), endDate: new Date("2023-02-20"), status: "APROVADO_GERENTE", abono: false }, // 20 dias
    ];

    vi.mocked(apMock.findMany).mockResolvedValue(periods as any);
    vi.mocked(vrMock.findMany).mockResolvedValue(requests as any);
    vi.mocked(vrMock.update).mockResolvedValue({} as any);

    await syncAcquisitionPeriodsForUser("u1", hireDate);

    // FIFO recalculado deve ser: ap1=30, ap2=10
    const calls = vi.mocked(apMock.update).mock.calls;
    const finalValues = new Map<string, number>();
    calls.forEach(call => {
      const args = call[0] as any;
      finalValues.set(args.where.id, args.data.usedDays);
    });

    expect(finalValues.get("ap1")).toBe(30);
    expect(finalValues.get("ap2")).toBe(10);
  });
});
