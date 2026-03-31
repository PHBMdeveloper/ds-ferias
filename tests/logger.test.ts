import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("Logger estruturado", () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T10:00:00Z"));
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("emite log de informação no formato JSON correto", () => {
    logger.info("Test message", { userId: "u1" });
    
    expect(consoleSpy.log).toHaveBeenCalled();
    const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
    
    expect(output).toEqual({
      level: "info",
      message: "Test message",
      timestamp: "2026-03-31T10:00:00.000Z",
      userId: "u1"
    });
  });

  it("formata erros automaticamente se passados no contexto", () => {
    const err = new Error("Real error");
    (err as any).code = "P2002";
    
    logger.error("Failed action", { error: err });
    
    const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.error.message).toBe("Real error");
    expect(output.error.code).toBe("P2002");
    expect(output.error.stack).toBeDefined();
  });

  it("formata erros passados como string ou objeto genérico", () => {
    logger.warn("Warning with string error", { err: "Something is wrong" });
    
    const output = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
    expect(output.error.message).toBe("Something is wrong");
  });

  it("não emite debug log em produção (simulado)", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    
    logger.debug("Secret debug");
    expect(consoleSpy.debug).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = "development";
    logger.debug("Visible debug");
    expect(consoleSpy.debug).toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });
});
