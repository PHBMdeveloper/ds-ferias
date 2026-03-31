import { logger } from "./logger";

/**
 * Memória volátil para rate limit básico em Route Handlers.
 * Em produção (serverless), este mapa é resetado a cada cold start,
 * mas serve como proteção primária contra abusos.
 */
const rateLimitMap = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 50, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    // LOGAR QUANDO O LIMITE É ATINGIDO
    logger.warn("Rate limit triggered", { 
      ip, 
      limit, 
      count: entry.count + 1 
    });
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
