import { describe, expect, it } from "vitest";
import { buildInclusiveOverlapConditions } from "@/lib/validation";

describe("buildInclusiveOverlapConditions", () => {
  it("gera condições inclusivas para bloquear conflito no mesmo dia", () => {
    const start = new Date("2026-04-10T00:00:00.000Z");
    const end = new Date("2026-04-15T00:00:00.000Z");

    const conditions = buildInclusiveOverlapConditions(start, end);

    expect(conditions).toEqual([
      { startDate: { lte: end } },
      { endDate: { gte: start } },
    ]);
  });
});
