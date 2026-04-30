import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const json = await request.json();
    const type = typeof json.type === "string" ? json.type.trim() : "";
    const isAnonymous = Boolean(json.isAnonymous);

    // Sanitização de campos de texto livre controlados pelo usuário
    const message = sanitizeText(json.message);
    const anonymousName = sanitizeText(json.anonymousName);

    if (!type || !message) {
      logger.warn("Feedback: dados inválidos", { userId: user.id, type, message });
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
        type,
        message,
        anonymousName: anonymousName || null,
      },
    });

    logger.info("Feedback enviado", { 
      userId: user.id, 
      feedbackId: feedback.id,
      type, 
      isAnonymous 
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    logger.error("Erro ao salvar feedback", { error });
    return NextResponse.json({ error: "Erro interno ao salvar feedback" }, { status: 500 });
  }
}
