import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { notify, notifyNewRequest, notifyApproved, notifyRejected } from "@/lib/notifications";

describe("notifications", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("does nothing when webhook is not configured", async () => {
    delete process.env.NOTIFY_WEBHOOK_URL;
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any);
    await notify({
      type: "APPROVED",
      requestId: "r1",
      userName: "U",
      userEmail: "u@example.com",
      approverName: "A",
      status: "APROVADO_RH",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to webhook when configured (ok response)", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "https://example.test/webhook";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch" as any)
      .mockResolvedValue({ ok: true, status: 200, text: async () => "" } as any);

    await notifyApproved({
      requestId: "r2",
      userName: "U2",
      userEmail: "u2@example.com",
      approverName: "A2",
      status: "APROVADO_RH",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as any[];
    expect(url).toBe("https://example.test/webhook");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.source).toBe("ds-ferias");
    expect(body.type).toBe("APPROVED");
    expect(body.requestId).toBe("r2");
    expect(typeof body.at).toBe("string");
  });

  it("logs webhook failure when response not ok", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "https://example.test/webhook";
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "fail",
    } as any);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await notifyRejected({
      requestId: "r3",
      userName: "U3",
      userEmail: "u3@example.com",
      approverName: "A3",
      note: "x",
    });

    expect(errSpy).toHaveBeenCalledWith("[notify] webhook failed", 500, "fail");
  });

  it("logs webhook error when fetch throws", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "https://example.test/webhook";
    vi.spyOn(globalThis, "fetch" as any).mockRejectedValue(new Error("net"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await notifyNewRequest({
      requestId: "r4",
      userName: "U4",
      userEmail: "u4@example.com",
      managerEmail: null,
      startDate: new Date("2026-06-01T12:00:00Z"),
      endDate: new Date("2026-06-10T12:00:00Z"),
    });

    expect(errSpy).toHaveBeenCalledWith("[notify] webhook error", expect.any(Error));
  });

  it("logs event in development mode", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NOTIFY_WEBHOOK_URL;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await notify({
      type: "NEW_REQUEST",
      requestId: "r5",
      userName: "U5",
      userEmail: "u5@example.com",
      managerEmail: "m@example.com",
      startDate: "2026-06-01",
      endDate: "2026-06-10",
    });

    expect(logSpy).toHaveBeenCalledWith("[notify]", "NEW_REQUEST", expect.any(Object));
  });
});

