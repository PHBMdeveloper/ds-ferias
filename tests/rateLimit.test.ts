import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientId } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows up to maxRequests within window", () => {
    const key = "test-key";
    const max = 3;
    const windowMs = 60_000;
    expect(checkRateLimit(key, max, windowMs)).toBe(true);
    expect(checkRateLimit(key, max, windowMs)).toBe(true);
    expect(checkRateLimit(key, max, windowMs)).toBe(true);
    expect(checkRateLimit(key, max, windowMs)).toBe(false);
  });
});

describe("getClientId", () => {
  it("uses x-forwarded-for when present", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(getClientId(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip or localhost", () => {
    const reqReal = new Request("https://example.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientId(reqReal)).toBe("9.9.9.9");

    const reqNone = new Request("https://example.com");
    expect(getClientId(reqNone)).toBe("127.0.0.1");
  });
});

