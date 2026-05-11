import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/feedback/route";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
  shouldForcePasswordChange: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedback: {
      create: vi.fn(),
    },
  },
}));

(prisma as any).feedback = {
  create: vi.fn(),
};

describe("Feedback API Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes feedback inputs to prevent XSS", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1", role: "FUNCIONARIO" } as any);
    vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({ id: "fb1" } as any);

    const body = {
      type: "BUG<script>alert('xss')</script>",
      message: "Erro na tela <img src=x onerror=alert('xss')>",
      isAnonymous: true,
      anonymousName: "Hacker <svg/onload=alert('xss')>"
    };
    const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect((prisma as any).feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "BUGalert('xss')",
        message: "Erro na tela",
        anonymousName: "Hacker"
      })
    });
  });
});
