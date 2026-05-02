import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sanitizeText } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { type, message, isAnonymous, anonymousName } = await request.json();

    const safeType = sanitizeText(type);
    const safeMessage = sanitizeText(message);
    const safeAnonymousName = sanitizeText(anonymousName);

    if (!safeType || !safeMessage) {
      logger.warn("Feedback: dados inválidos", { userId: user.id, type: safeType, message: safeMessage });
      return NextResponse.json({ error: "Tipo e mensagem são obrigatórios" }, { status: 400 });
    }

    const feedbackModel = (prisma as any).feedback;
    
    if (!feedbackModel) {
      logger.error("Modelo 'feedback' não encontrado no Prisma Client.");
      return NextResponse.json({ error: "Erro de configuração no servidor" }, { status: 500 });
    }

    const feedback = await feedbackModel.create({
      data: {
        user: !isAnonymous ? { connect: { id: user.id } } : undefined,
        type: safeType,
        message: safeMessage,
        anonymousName: safeAnonymousName || null,
      },
    });

    logger.info("Feedback enviado", { 
      userId: user.id, 
      feedbackId: feedback.id,
      type: safeType,
      isAnonymous 
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    logger.error("Erro ao salvar feedback", { error });
    return NextResponse.json({ error: "Erro interno ao salvar feedback" }, { status: 500 });
  }
}
