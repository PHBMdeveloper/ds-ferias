import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/feedback/route";
import { PATCH, DELETE } from "@/app/api/admin/feedbacks/[id]/route";
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
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Para contornar o bypass de tipagem (prisma as any).feedback no código
(prisma as any).feedback = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe("Feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/feedback", () => {
    it("cria um feedback vinculado ao usuário se não for anônimo", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1", role: "FUNCIONARIO" } as any);
      vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({ id: "fb1" } as any);

      const body = { type: "BUG", message: "Erro na tela", isAnonymous: false };
      const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
      
      const res = await POST(req);
      expect(res.status).toBe(200);
      
      expect((prisma as any).feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user: { connect: { id: "u1" } },
          type: "BUG",
          message: "Erro na tela"
        })
      });
    });

    it("cria um feedback anônimo se solicitado", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1", role: "FUNCIONARIO" } as any);
      vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({ id: "fb2" } as any);

      const body = { type: "SUGGESTION", message: "Sugestão", isAnonymous: true, anonymousName: "Alguém" };
      const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
      
      const res = await POST(req);
      expect(res.status).toBe(200);
      
      expect((prisma as any).feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user: undefined,
          anonymousName: "Alguém"
        })
      });
    });

    it("retorna 400 se dados estiverem faltando", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1" } as any);
      const body = { type: "BUG" }; // falta message
      const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
      
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("sanitiza inputs de texto removendo tags HTML para evitar XSS", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u1", role: "FUNCIONARIO" } as any);
      vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({ id: "fb3" } as any);

      const body = {
        type: "BUG",
        message: "<script>alert('xss')</script>Erro na tela <b>bold</b>",
        isAnonymous: true,
        anonymousName: "Alguém <i>malicioso</i>"
      };
      const req = new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect((prisma as any).feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: "alert('xss')Erro na tela bold",
          anonymousName: "Alguém malicioso"
        })
      });
    });
  });

  describe("Admin Routes /api/admin/feedbacks/[id]", () => {
    it("permite RH atualizar status do feedback", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u-rh", role: "RH" } as any);
      const req = new Request("http://localhost/api/admin/feedbacks/fb1", { 
        method: "PATCH", 
        body: JSON.stringify({ status: "RESOLVIDO" }) 
      });
      
      const res = await PATCH(req, { params: Promise.resolve({ id: "fb1" }) });
      expect(res.status).toBe(200);
      expect((prisma as any).feedback.update).toHaveBeenCalledWith({
        where: { id: "fb1" },
        data: { status: "RESOLVIDO" }
      });
    });

    it("bloqueia exclusão por usuários que não são RH", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "u-coord", role: "COORDENADOR" } as any);
      const req = new Request("http://localhost/api/admin/feedbacks/fb1", { method: "DELETE" });
      
      const res = await DELETE(req, { params: Promise.resolve({ id: "fb1" }) });
      expect(res.status).toBe(403);
    });
  });
});
