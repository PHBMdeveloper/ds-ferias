import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, shouldForcePasswordChange } from "@/lib/auth";
import { ROLE_LEVEL } from "@/lib/vacationRules";
import { logger } from "@/lib/logger";

// GET - lista períodos de bloqueio (qualquer usuário autenticado pode ver)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (shouldForcePasswordChange(user)) {
    return NextResponse.json({ error: "Você precisa trocar a senha antes de continuar." }, { status: 403 });
  }

  const blackouts = await prisma.blackoutPeriod.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ blackouts });
}

// POST - cria período de bloqueio (somente RH e GERENTE)
export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user || ROLE_LEVEL[user.role] < 3) {
    return NextResponse.json({ error: "Apenas Gerentes e RH podem criar períodos de bloqueio." }, { status: 403 });
  }
  if (user && shouldForcePasswordChange(user)) {
    return NextResponse.json({ error: "Você precisa trocar a senha antes de continuar." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.startDate || !body?.endDate || !body?.reason) {
    return NextResponse.json({ error: "Campos obrigatórios: startDate, endDate, reason." }, { status: 400 });
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return NextResponse.json({ error: "Período inválido." }, { status: 400 });
  }

  try {
    const blackout = await prisma.blackoutPeriod.create({
      data: {
        startDate: start,
        endDate: end,
        reason: body.reason,
        department: body.department ?? null,
        createdById: user.id,
      },
    });

    logger.info("Blackout period created", { actorId: user.id, blackoutId: blackout.id, reason: body.reason });

    return NextResponse.json({ blackout }, { status: 201 });
  } catch (err) {
    logger.error("Error creating blackout period", { actorId: user.id, error: err });
    return NextResponse.json({ error: "Erro ao criar período de bloqueio." }, { status: 500 });
  }
}

// DELETE - remove período de bloqueio (somente RH e GERENTE)
export async function DELETE(request: Request) {
  const user = await getSessionUser();

  if (!user || ROLE_LEVEL[user.role] < 3) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (user && shouldForcePasswordChange(user)) {
    return NextResponse.json({ error: "Você precisa trocar a senha antes de continuar." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  try {
    await prisma.blackoutPeriod.delete({ where: { id } });
    logger.info("Blackout period deleted", { actorId: user.id, blackoutId: id });
  } catch (err) {
    logger.error("Error deleting blackout period", { actorId: user.id, blackoutId: id, error: err });
    return NextResponse.json({ error: "Erro ao excluir período de bloqueio." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
