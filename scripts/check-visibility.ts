/**
 * Analisa o banco para ver por que solicitações podem não aparecer na Caixa de Aprovação.
 * Rode: npx tsx scripts/check-visibility.ts
 * (Requer dotenv com DATABASE_URL no .env)
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getRoleLevel, hasTeamVisibility } from "../lib/vacationRules";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida no .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n=== USUÁRIOS (quem é coordenador/gerente de quem) ===\n");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  for (const u of users) {
    const managerInfo = u.managerId
      ? ` → Coord./Gerente: ${u.manager?.name ?? "?"} (${u.manager?.email ?? u.managerId})`
      : " → [SEM COORDENADOR/GERENTE]";
    console.log(`${u.role.padEnd(14)} ${u.email.padEnd(28)} ${u.name}${managerInfo}`);
  }

  console.log("\n=== SOLICITAÇÕES DE FÉRIAS ===\n");

  const requests = await prisma.vacationRequest.findMany({
    orderBy: { startDate: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          managerId: true,
          manager: { select: { id: true, name: true, email: true, managerId: true } },
        },
      },
    },
  });

  if (requests.length === 0) {
    console.log("Nenhuma solicitação no banco.");
    return;
  }

  for (const r of requests) {
    const u = r.user;
    const managerInfo = u.managerId
      ? `Coordenador/Gerente: ${u.manager?.name ?? "?"} (id: ${u.managerId})`
      : "⚠ SEM COORDENADOR/GERENTE — não aparece para ninguém na Caixa de Aprovação";
    console.log(`Solicitação ${r.id.slice(0, 8)}... | ${r.status.padEnd(22)} | Por: ${u.name} (${u.email})`);
    console.log(`  ${managerInfo}`);
    console.log("");
  }

  console.log("=== QUEM VÊ CADA SOLICITAÇÃO (por coordenador/gerente) ===\n");

  const approvers = users.filter(
    (u) => getRoleLevel(u.role) >= 2 && ["COORDENADOR", "GESTOR", "GERENTE", "RH"].includes(u.role)
  );

  for (const r of requests) {
    const reqForVisibility = {
      userId: r.userId,
      user: {
        managerId: r.user.managerId,
        manager: r.user.manager ? { managerId: r.user.manager.managerId } : undefined,
      },
    };
    console.log(`Solicitação de ${r.user.name} (${r.status}):`);
    for (const approver of approvers) {
      const visible = hasTeamVisibility(approver.role, approver.id, reqForVisibility);
      const label = visible ? "  ✓ Vê" : "  ✗ Não vê";
      console.log(`${label} → ${approver.email} (${approver.name}, ${approver.role})`);
    }
    console.log("");
  }

  console.log("Para ver as solicitações na Caixa de Aprovação:");
  console.log("  → Entre com o e-mail do usuário que aparece como '✓ Vê' (ex.: gestor@empresa.com).");
  console.log("  → Se você usa outro e-mail (ex.: gestor1@empresa.com), no Backoffice defina os colaboradores");
  console.log("    com esse usuário como Coordenador/Gerente, ou use o e-mail que já está vinculado.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
