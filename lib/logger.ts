/**
 * Logging estruturado para APIs: erros e ações sensíveis (login, aprovação, export).
 * Saída em JSON para facilitar agregação e busca em produção (ex: Vercel Logs).
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogPayload = Record<string, unknown> & {
  message: string;
  level: LogLevel;
  timestamp: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
};

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      // Alguns erros do Prisma/Node possuem código
      code: (error as any).code || (error as any).status,
    };
  }
  if (typeof error === "string") return { message: error };
  return { message: String(error) };
}

function log(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  // Em desenvolvimento, podemos querer algo mais legível, mas JSON é o padrão de prod
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Se houver um objeto 'err' ou 'error' no contexto, formatamos ele
  const errorObj = context.err || context.error;
  if (errorObj) {
    payload.error = formatError(errorObj);
    delete payload.err;
    delete payload.error;
  }

  const line = JSON.stringify(payload);
  
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(line);
      }
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    log("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    log("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    log("error", message, context);
  },
  debug(message: string, context?: Record<string, unknown>) {
    log("debug", message, context);
  },
};
