import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVacationRequestsForExport } from "@/services/vacationRequestListService";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vacationRequest: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/requestVisibility", async () => {
  const actual = await vi.importActual<typeof import("@/lib/requestVisibility")>("@/lib/requestVisibility");
  return {
    ...actual,
    filterRequestsByVisibilityAndView: vi.fn((role, userId, requests, filters) => {
      // Para o teste, apenas retorna a própria lista recebida
      return requests;
    }),
  };
});

const { prisma } = await import("@/lib/prisma");
const { filterRequestsByVisibilityAndView } = await import("@/lib/requestVisibility");

describe("getVacationRequestsForExport", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("usa buildManagedRequestsWhere para aprovadores e retorna lista filtrada", async () => {
    (prisma.vacationRequest.findMany as vi.Mock).mockResolvedValueOnce([
      {
        id: "req-1",
        userId: "u1",
        status: "PENDENTE",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-10"),
        user: { name: "Fulano", email: "f@e.com" },
        history: [],
      },
    ]);

    const user = { id: "coord-1", role: "COORDENADOR" };
    const filters = { query: "", status: "TODOS", view: "inbox", managerId: "", from: "", to: "", department: "" };

    const result = await getVacationRequestsForExport(user, filters);

    expect(prisma.vacationRequest.findMany).toHaveBeenCalledTimes(1);
    expect(filterRequestsByVisibilityAndView).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("req-1");
  });
});

