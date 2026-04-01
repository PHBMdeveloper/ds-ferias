import { describe, it, expect } from "vitest";
import { escapeCsvFormulas } from "@/lib/csv";

describe("escapeCsvFormulas", () => {
  it("returns empty string for null or undefined", () => {
    expect(escapeCsvFormulas(null)).toBe("");
    expect(escapeCsvFormulas(undefined)).toBe("");
  });

  it("sanitizes semicolons", () => {
    expect(escapeCsvFormulas("hello;world")).toBe("hello,world");
  });

  it("escapes CSV injection characters", () => {
    expect(escapeCsvFormulas("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCsvFormulas("+cell")).toBe("'+cell");
    expect(escapeCsvFormulas("-negative")).toBe("'-negative");
  });

  it("escapes @, tab and carriage return", () => {
    expect(escapeCsvFormulas("@admin")).toBe("'@admin");
    expect(escapeCsvFormulas("\tdata")).toBe("'\tdata");
    expect(escapeCsvFormulas("\rdata")).toBe("'\rdata");
  });

  it("returns normal strings as is", () => {
    expect(escapeCsvFormulas("normal string")).toBe("normal string");
    expect(escapeCsvFormulas(123)).toBe("123");
  });
});
