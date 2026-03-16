import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { calculateVacationBalance } from "@/lib/vacationRules";
import { findUserWithBalance } from "@/repositories/userRepository";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await findUserWithBalance(session.id);

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const balance = calculateVacationBalance(
    user.hireDate,
    user.vacationRequests,
  );

  return NextResponse.json({ balance });
}
