import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRoleLevel } from "@/lib/vacationRules";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  
  // Apenas Admin/RH (nível 5) ou Gerentes (nível 2+) podem ver feedbacks?
  // Vamos deixar para nível 2+ (quem tem acesso ao Backoffice)
  if (getRoleLevel(user.role) < 2) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    logger.error("Erro ao carregar feedbacks", { error });
    return NextResponse.json({ error: "Erro interno ao carregar feedbacks" }, { status: 500 });
  }
}
