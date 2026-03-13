import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const existing = await prisma.vacationRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const isOwner = existing.userId === user.id;
  const isManager = user.role === "GESTOR" || user.role === "RH";

  // Regra para colaborador:
  // - Pode excluir enquanto o RH ainda não tiver atuado:
  //   - PENDENTE (antes do gestor)
  //   - APROVADO_GESTOR (pendente RH)
  // - Não pode excluir depois que o RH aprovou ou reprovou.
  if (isOwner) {
    if (existing.status !== "PENDENTE" && existing.status !== "APROVADO_GESTOR") {
      return NextResponse.json(
        { error: "Você só pode excluir solicitações pendentes ou aprovadas apenas pelo gestor (aguardando RH)." },
        { status: 400 },
      );
    }
  }

  if (!isOwner && !isManager) {
    return NextResponse.json(
      { error: "Você não tem permissão para excluir este pedido." },
      { status: 403 },
    );
  }

  await prisma.vacationRequestHistory.deleteMany({
    where: { vacationRequestId: existing.id },
  });

  await prisma.vacationRequest.delete({
    where: { id: existing.id },
  });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.json({ ok: true });
}

