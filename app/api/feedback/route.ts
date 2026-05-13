import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sanitizeText } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const body = await request.json();
    const rawType = body.type;
    const rawMessage = body.message;
    const isAnonymous = body.isAnonymous;

    if (!rawType || !rawMessage) {
      logger.warn("Feedback: dados inválidos", { userId: user.id, type: rawType, inputMessage: rawMessage });
      return NextResponse.json({ error: "Tipo e mensagem são obrigatórios" }, { status: 400 });
    }
    const message = sanitizeText(rawMessage);
    const anonymousName = sanitizeText(body.anonymousName);

    const feedbackModel = (prisma as any).feedback;
    
    if (!feedbackModel) {
      logger.error("Modelo 'feedback' não encontrado no Prisma Client.");
      return NextResponse.json({ error: "Erro de configuração no servidor" }, { status: 500 });
    }

    const feedback = await feedbackModel.create({
      data: {
        user: !isAnonymous ? { connect: { id: user.id } } : undefined,
        type: rawType,
        message,
        anonymousName: anonymousName || null,
      },
    });

    logger.info("Feedback enviado", { 
      userId: user.id, 
      feedbackId: feedback.id,
      type: rawType,
      isAnonymous 
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    logger.error("Erro ao salvar feedback", { error });
    return NextResponse.json({ error: "Erro interno ao salvar feedback" }, { status: 500 });
  }
}
