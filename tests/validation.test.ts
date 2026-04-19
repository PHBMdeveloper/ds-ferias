import { describe, it, expect } from "vitest";
import { isCuid, requireCuid, sanitizeText } from "@/lib/validation";

describe("isCuid", () => {
  it("accepts valid CUID-like ids (20-30 alphanumeric)", () => {
    expect(isCuid("ckl2abc3def4ghi5jkl6mno")).toBe(true);
    expect(isCuid("abcdefghij1234567890")).toBe(true);
    expect(isCuid("A1B2C3D4E5F6G7H8I9J0K1L2M")).toBe(true);
  });

  it("rejects empty or too short strings", () => {
    expect(isCuid("")).toBe(false);
    expect(isCuid("abc")).toBe(false);
    expect(isCuid("1234567890123456789")).toBe(false); // 19 chars
  });

  it("rejects too long or invalid chars", () => {
    expect(isCuid("a".repeat(31))).toBe(false);
    expect(isCuid("ckl2abc3def4ghi5jkl6mno-")).toBe(false);
    expect(isCuid("ckl2abc3def4ghi5jkl6mno ")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isCuid(null)).toBe(false);
    expect(isCuid(undefined)).toBe(false);
    expect(isCuid(123)).toBe(false);
  });
});

describe("requireCuid", () => {
  it("returns id when valid", () => {
    expect(requireCuid("ckl2abc3def4ghi5jkl6mno")).toBe("ckl2abc3def4ghi5jkl6mno");
  });
  it("returns null when invalid", () => {
    expect(requireCuid("")).toBe(null);
    expect(requireCuid("x")).toBe(null);
  });
});

describe("sanitizeText", () => {
  it("escapes basic HTML tags to prevent XSS", () => {
    expect(sanitizeText("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes other HTML entities", () => {
    expect(sanitizeText("Tom & Jerry's \"house\"")).toBe("Tom &amp; Jerry&#039;s &quot;house&quot;");
  });

  it("returns null for non-strings or empty strings", () => {
    expect(sanitizeText(null)).toBe(null);
    expect(sanitizeText(undefined)).toBe(null);
    expect(sanitizeText(123)).toBe(null);
    expect(sanitizeText("   ")).toBe(null);
  });
});
