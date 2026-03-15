import { describe, it, expect } from "vitest";
import { cn, normalizeParam } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "block")).toBe("base block");
  });

  it("merges tailwind conflicting classes (twMerge)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("normalizeParam", () => {
  it("returns string as-is", () => {
    expect(normalizeParam("hello")).toBe("hello");
  });

  it("returns first element for array", () => {
    expect(normalizeParam(["a", "b"])).toBe("a");
  });

  it("returns default for empty array", () => {
    expect(normalizeParam([])).toBe("");
    expect(normalizeParam([], "x")).toBe("x");
  });

  it("returns default for undefined", () => {
    expect(normalizeParam(undefined)).toBe("");
    expect(normalizeParam(undefined, "default")).toBe("default");
  });
});
