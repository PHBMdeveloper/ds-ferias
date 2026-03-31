import { NextResponse } from "next/server";
import { getSessionUser, hashNewUserPassword, setSessionCookieOnResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < 4) {
    logger.warn("Failed password change attempt: password too short", { actorId: user.id });
    return NextResponse.json({ error: "A senha deve ter pelo menos 4 dígitos." }, { status: 400 });
  }

  const passwordHash = hashNewUserPassword(password);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    logger.info("Password changed successfully", { actorId: user.id });

    const response = NextResponse.json({ ok: true });
    setSessionCookieOnResponse(response, {
      ...user,
      mustChangePassword: false,
    });

    return response;
  } catch (err) {
    logger.error("Error changing password", { actorId: user.id, error: err });
    return NextResponse.json({ error: "Erro ao trocar a senha." }, { status: 500 });
  }
}

