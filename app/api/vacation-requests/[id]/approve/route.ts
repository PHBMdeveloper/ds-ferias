import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canApproveRequest, getNextApprovalStatus, ROLE_LEVEL, detectTeamConflicts } from "@/lib/vacationRules";
import { notifyApproved } from "@/lib/notifications";
import { isCuid } from "@/lib/validation";
import { logger } from "@/lib/logger";
import type { VacationStatus } from "@/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isCuid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const user = await getSessionUser();

  // Apenas COORDENADOR, GESTOR, GERENTE e RH podem aprovar
  if (!user || ROLE_LEVEL[user.role] < 2) {
    return NextResponse.json({ error: "Sem permissão para aprovar solicitações." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const confirmConflict = body?.confirmConflict === true;

  const existing = await prisma.vacationRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          managerId: true,
          manager: { select: { managerId: true } },
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  // Verifica se pode aprovar (lógica de hierarquia)
  const canApprove = canApproveRequest(user.role, user.id, {
    userId: existing.userId,
    status: existing.status,
    user: { role: existing.user.role },
  });

  if (!canApprove) {
    return NextResponse.json(
      { error: "Você não tem permissão para aprovar esta solicitação neste momento." },
      { status: 403 },
    );
  }

  // Para COORDENADOR/GESTOR: só pode aprovar do seu time direto
  if (ROLE_LEVEL[user.role] === 2) {
    if (existing.user.managerId !== user.id) {
      return NextResponse.json(
        { error: "Você só pode aprovar solicitações do seu time direto." },
        { status: 403 },
      );
    }
  }

  // Para GERENTE: pode aprovar reportes diretos (coordenadores) e indiretos (funcionários dos coordenadores)
  if (ROLE_LEVEL[user.role] === 3) {
    const isDirectReport = existing.user.managerId === user.id;
    const isIndirectReport = existing.user.manager?.managerId === user.id;
    const isOwnRequest = existing.userId === user.id;

    if (!isDirectReport && !isIndirectReport && !isOwnRequest) {
      return NextResponse.json(
        { error: "Você só pode aprovar solicitações da sua cadeia de equipe." },
        { status: 403 },
      );
    }
  }

  const nextStatus = getNextApprovalStatus(user.role) as VacationStatus;
  const noteField = ROLE_LEVEL[user.role] === 2 ? "managerNote" : "hrNote";

  // Alerta de conflito de férias no time.
  let conflictWarning: string | null = null;
  let hasConflict = false;
  try {
    if (existing.user.managerId && existing.startDate && existing.endDate) {
      const teammates = await prisma.user.findMany({
        where: {
          managerId: existing.user.managerId,
          NOT: { id: existing.userId },
        },
        select: {
          name: true,
          vacationRequests: {
            select: {
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      });

      const teamMembers = teammates.map((t) => ({
        name: t.name,
        requests: t.vacationRequests,
      }));

      if (teamMembers.length > 0) {
        const conflict = detectTeamConflicts(
          new Date(existing.startDate),
          new Date(existing.endDate),
          teamMembers,
        );

        if (conflict.isWarning || conflict.isBlocked) {
          hasConflict = true;
          const base =
            conflict.conflictingCount === 1
              ? `${conflict.conflictingCount} outra pessoa do time está com férias neste período.`
              : `${conflict.conflictingCount} pessoas do time estão com férias neste período.`;
          const severity = conflict.isBlocked
            ? " Risco alto de conflito de férias no time."
            : " Avalie se esse conflito é aceitável antes de confirmar.";
          conflictWarning = `Atenção: ${base}${severity}`;
        }
      }
    }
  } catch (err) {
    logger.warn("Falha ao calcular conflito de férias; prosseguindo com aprovação.", { error: String(err) });
  }

  if (hasConflict && !confirmConflict && conflictWarning) {
    return NextResponse.json(
      { error: conflictWarning, requiresConfirmation: true },
      { status: 409 },
    );
  }

  const updated = await prisma.vacationRequest.update({
    where: { id },
    data: {
      status: nextStatus,
      [noteField]: body?.note ?? null,
      history: {
        create: {
          previousStatus: existing.status,
          newStatus: nextStatus,
          changedByUserId: user.id,
          note: body?.note ?? null,
        },
      },
    },
  });

  if (existing.user?.name && existing.user?.email && user.name) {
    notifyApproved({
      requestId: id,
      userName: existing.user.name,
      userEmail: existing.user.email,
      approverName: user.name,
      status: nextStatus,
    }).catch(() => {});
  }

  logger.info("Solicitação aprovada", {
    requestId: id,
    approverId: user.id,
    newStatus: nextStatus,
  });
  return NextResponse.json({ request: updated, conflictWarning });
}
