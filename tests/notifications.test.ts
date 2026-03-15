import { describe, it, expect, vi, beforeEach } from "vitest";
import { notify, notifyNewRequest, notifyApproved, notifyRejected } from "@/lib/notifications";

describe("notify", () => {
  const origEnv = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NOTIFY_WEBHOOK_URL = "";
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls fetch when NOTIFY_WEBHOOK_URL is set", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    process.env.NOTIFY_WEBHOOK_URL = "https://example.com/hook";
    await notify({
      type: "NEW_REQUEST",
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      startDate: "2026-06-01",
      endDate: "2026-06-14",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.type).toBe("NEW_REQUEST");
    expect(body.requestId).toBe("r1");
    expect(body.source).toBe("ds-ferias");
    expect(body.at).toBeDefined();
  });

  it("does not throw when webhook returns not ok", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, text: () => Promise.resolve("error") } as Response);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NOTIFY_WEBHOOK_URL = "https://example.com/hook";
    await notify({
      type: "REJECTED",
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      approverName: "Maria",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not throw when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NOTIFY_WEBHOOK_URL = "https://example.com/hook";
    await notify({
      type: "APPROVED",
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      approverName: "Maria",
      status: "APROVADO_RH",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not call fetch when NOTIFY_WEBHOOK_URL is empty", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "";
    await notify({
      type: "NEW_REQUEST",
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      startDate: "2026-06-01",
      endDate: "2026-06-14",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("notifyNewRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    process.env.NOTIFY_WEBHOOK_URL = "https://hook";
  });

  it("sends NEW_REQUEST with date strings", async () => {
    await notifyNewRequest({
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      managerEmail: "m@e.com",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-14"),
    });
    expect(fetch).toHaveBeenCalled();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body as string);
    expect(body.type).toBe("NEW_REQUEST");
    expect(body.startDate).toBe("2026-06-01");
    expect(body.endDate).toBe("2026-06-14");
    expect(body.managerEmail).toBe("m@e.com");
  });
});

describe("notifyApproved", () => {
  it("sends APPROVED event", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    process.env.NOTIFY_WEBHOOK_URL = "https://hook";
    await notifyApproved({
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      approverName: "Maria",
      status: "APROVADO_RH",
    });
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body as string);
    expect(body.type).toBe("APPROVED");
    expect(body.status).toBe("APROVADO_RH");
  });
});

describe("notifyRejected", () => {
  it("sends REJECTED event with optional note", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    process.env.NOTIFY_WEBHOOK_URL = "https://hook";
    await notifyRejected({
      requestId: "r1",
      userName: "João",
      userEmail: "j@e.com",
      approverName: "Maria",
      note: "Período bloqueado",
    });
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body as string);
    expect(body.type).toBe("REJECTED");
    expect(body.note).toBe("Período bloqueado");
  });
});
