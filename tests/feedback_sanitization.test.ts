import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/feedback/route";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
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

describe("Feedback API Sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes HTML from message and anonymousName", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1" } as any);
    vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({ id: "fb1" } as any);

    const body = {
      type: "BUG",
      message: "<script>alert('xss')</script>Erro na tela",
      isAnonymous: true,
      anonymousName: "Hacker <img src=x onerror=alert(1)>"
    };

    const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect((prisma as any).feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        message: "alert('xss')Erro na tela",
        anonymousName: "Hacker"
      })
    });
  });
});
