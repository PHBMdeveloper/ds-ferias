import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockGet })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Session Bypass Vulnerability Repro", () => {
  beforeEach(() => {
    mockGet.mockReset();
    process.env.SESSION_SECRET = "a".repeat(16); // Secret is set
  });

  it("FIXED: cannot bypass authentication with unsigned cookie when SESSION_SECRET is set", async () => {
    // This payload does NOT contain a dot
    const data: SessionUser = { id: "u1", name: "U", email: "admin@corpcom", role: "RH" };
    const unsignedPayload = JSON.stringify(data);

    // Ensure the payload doesn't have a dot (email without dot)
    expect(unsignedPayload).not.toContain(".");

    mockGet.mockReturnValue({ value: unsignedPayload });

    // Fixed code will always call verifyPayload if SESSION_SECRET is set
    const user = await getSessionUser();

    // Should be NULL because it lacks a signature
    expect(user).toBeNull();
  });

  it("VULNERABLE: can bypass authentication with unsigned cookie even with dot in email", async () => {
    // Even if it has a dot, if the attacker doesn't provide a dot in the cookie value
    // (e.g., they don't append a signature), it might still bypass if we don't enforce it.
    // Actually, the current code checks `raw.includes(".")`.
    // If the attacker provides a raw JSON that has a dot (like in the email), it *will* call verifyPayload.
    // If it DOESN'T have a dot, it skips verifyPayload.

    const data: SessionUser = { id: "u1", name: "U", email: "user@empresa.com", role: "RH" };
    const unsignedPayload = JSON.stringify(data);

    expect(unsignedPayload).toContain("."); // contains dot in email

    mockGet.mockReturnValue({ value: unsignedPayload });

    // Current code:
    // if (getSessionSecret() && raw.includes(".")) {
    //   payload = verifyPayload(raw) ?? "";
    //   if (!payload) return null;
    // } else {
    //   payload = raw;
    // }

    // Since unsignedPayload contains a dot, verifyPayload(unsignedPayload) will be called.
    // verifyPayload will try to find the last dot.
    // For '{"id":"u1","name":"U","email":"user@empresa.com","role":"RH"}', the last dot is in the email.
    // It will split it into payload = '{"id":"u1","name":"U","email":"user@empresa' and sig = 'com","role":"RH"}'
    // This will definitely fail verification and return null.

    const user = await getSessionUser();
    expect(user).toBeNull(); // This case is actually NOT vulnerable because the dot triggers verification.
  });
});
