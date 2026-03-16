import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  it("logs info with message and level", () => {
    logger.info("teste-info", { foo: "bar" });
    expect(console.log).toHaveBeenCalledTimes(1);
    const arg = (console.log as unknown as vi.Mock).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.message).toBe("teste-info");
    expect(parsed.level).toBe("info");
    expect(parsed.foo).toBe("bar");
  });

  it("logs warn with message and level", () => {
    logger.warn("teste-warn", { a: 1 });
    const arg = (console.warn as unknown as vi.Mock).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("teste-warn");
  });

  it("logs error with message and level", () => {
    logger.error("teste-error", { x: 42 });
    const arg = (console.error as unknown as vi.Mock).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("teste-error");
  });
});

