import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "postgresql://localhost:5432/test";

import {
  getVisibleRequests,
  getPendingCount,
} from "@/services/dashboardDataService";

describe("getVisibleRequests", () => {
  const baseReq = {
    userId: "f1",
    status: "PENDENTE",
    user: { managerId: "coord-1", manager: null },
  };

  it("RH sees all requests", () => {
    const list = [
      { ...baseReq, userId: "f1" },
      { ...baseReq, userId: "f2", user: { managerId: "other", manager: null } },
    ];
    const out = getVisibleRequests("RH", "rh-1", list);
    expect(out).toHaveLength(2);
  });

  it("Coordenador sees only direct reports", () => {
    const list = [
      { ...baseReq, userId: "f1", user: { managerId: "coord-1", manager: null } },
      { ...baseReq, userId: "f2", user: { managerId: "other", manager: null } },
    ];
    const out = getVisibleRequests("COORDENADOR", "coord-1", list);
    expect(out).toHaveLength(1);
    expect(out[0].userId).toBe("f1");
  });

  it("Gerente sees indirect reports", () => {
    const list = [
      {
        ...baseReq,
        userId: "f1",
        user: { managerId: "coord-1", manager: { managerId: "ger-1" } },
      },
    ];
    const out = getVisibleRequests("GERENTE", "ger-1", list);
    expect(out).toHaveLength(1);
  });
});

describe("getPendingCount", () => {
  const req = (status: string) => ({
    userId: "f1",
    status,
    user: { managerId: "c1", manager: null },
  });

  it("level 2: counts only PENDENTE", () => {
    const list = [
      req("PENDENTE"),
      req("PENDENTE"),
      req("APROVADO_COORDENADOR"),
    ];
    expect(getPendingCount(2, list)).toBe(2);
  });

  it("level 3: counts PENDENTE and APROVADO_COORDENADOR/APROVADO_GESTOR", () => {
    const list = [
      req("PENDENTE"),
      req("APROVADO_COORDENADOR"),
      req("APROVADO_GERENTE"),
    ];
    expect(getPendingCount(3, list)).toBe(2);
  });

  it("level 4: counts only APROVADO_GERENTE", () => {
    const list = [
      req("APROVADO_GERENTE"),
      req("APROVADO_GERENTE"),
      req("PENDENTE"),
    ];
    expect(getPendingCount(4, list)).toBe(2);
  });

  it("other level: returns 0", () => {
    expect(getPendingCount(1, [req("PENDENTE")])).toBe(0);
  });
});
