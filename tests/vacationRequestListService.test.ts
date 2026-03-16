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

  it("para colaborador usa where simples por userId e aplica filtros locais de status/query/department", async () => {
    (prisma.vacationRequest.findMany as vi.Mock).mockResolvedValueOnce([
      {
        id: "req-2",
        userId: "u-collab",
        status: "PENDENTE",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        user: { name: "Colaborador X", email: "c@e.com", department: "TI" },
        history: [],
      },
    ]);

    const user = { id: "u-collab", role: "FUNCIONARIO" };
    const filters = {
      query: "Colaborador",
      status: "PENDENTE",
      view: "inbox",
      managerId: "",
      from: "",
      to: "",
      department: "TI",
    };

    const result = await getVacationRequestsForExport(user, filters);

    expect(prisma.vacationRequest.findMany).toHaveBeenCalledTimes(1);
    const whereArg = (prisma.vacationRequest.findMany as vi.Mock).mock.calls[0][0].where;
    expect(whereArg.userId).toBe("u-collab");
    expect(whereArg.status).toBe("PENDENTE");
    expect(whereArg.user).toMatchObject({
      name: { contains: "Colaborador", mode: "insensitive" },
      department: "TI",
    });
    expect(filterRequestsByVisibilityAndView).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });
});

