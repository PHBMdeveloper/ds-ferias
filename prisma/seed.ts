/**
 * Seed alinhado à sua tabela User (Prisma Studio).
 * IDs: gestor1, gestor2, gerente1, gerente2, rh1, rh2, colab1, colab2.
 * Senha para todos: senha123
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Configure o .env e rode: npx prisma db seed");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  const senhaHash = hashPassword("senha123");

  // Gestor Um (COORDENADOR)
  const gestor1 = await prisma.user.upsert({
    where: { email: "gestor1@empresa.com" },
    update: { name: "Gestor Um", role: "COORDENADOR", passwordHash: senhaHash },
    create: {
      id: "gestor1",
      name: "Gestor Um",
      email: "gestor1@empresa.com",
      passwordHash: senhaHash,
      role: "COORDENADOR",
    },
  });

  // Gestor Dois (COORDENADOR) — managerId: gestor1 (conforme sua tabela)
  const gestor2 = await prisma.user.upsert({
    where: { email: "gestor2@empresa.com" },
    update: { name: "Gestor Dois", role: "COORDENADOR", passwordHash: senhaHash, managerId: gestor1.id },
    create: {
      id: "gestor2",
      name: "Gestor Dois",
      email: "gestor2@empresa.com",
      passwordHash: senhaHash,
      role: "COORDENADOR",
      managerId: gestor1.id,
    },
  });

  // Gestor Um reporta ao Gestor Dois (conforme sua tabela: gestor1.managerId = gestor2)
  await prisma.user.update({
    where: { id: gestor1.id },
    data: { managerId: gestor2.id },
  });

  // Gerente Um (GERENTE) — reporta ao Gestor Um
  await prisma.user.upsert({
    where: { email: "gerente1@empresa.com" },
    update: { name: "Gerente Um", role: "GERENTE", passwordHash: senhaHash, managerId: gestor1.id },
    create: {
      id: "gerente1",
      name: "Gerente Um",
      email: "gerente1@empresa.com",
      passwordHash: senhaHash,
      role: "GERENTE",
      managerId: "gestor1",
    },
  });

  // Gerente Dois (GERENTE) — reporta ao Gestor Dois
  await prisma.user.upsert({
    where: { email: "gerente2@empresa.com" },
    update: { name: "Gerente Dois", role: "GERENTE", passwordHash: senhaHash, managerId: gestor2.id },
    create: {
      id: "gerente2",
      name: "Gerente Dois",
      email: "gerente2@empresa.com",
      passwordHash: senhaHash,
      role: "GERENTE",
      managerId: "gestor2",
    },
  });

  // RH Um e RH Dois
  await prisma.user.upsert({
    where: { email: "rh1@empresa.com" },
    update: { name: "RH Um", role: "RH", passwordHash: senhaHash, managerId: gestor1.id },
    create: {
      id: "rh1",
      name: "RH Um",
      email: "rh1@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
      managerId: "gestor1",
    },
  });

  await prisma.user.upsert({
    where: { email: "rh2@empresa.com" },
    update: { name: "RH Dois", role: "RH", passwordHash: senhaHash, managerId: gestor2.id },
    create: {
      id: "rh2",
      name: "RH Dois",
      email: "rh2@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
      managerId: "gestor2",
    },
  });

  // Colaborador Um — reporta ao Gestor Um
  await prisma.user.upsert({
    where: { email: "colaborador1@empresa.com" },
    update: { name: "Colaborador Um", role: "FUNCIONARIO", passwordHash: senhaHash, managerId: gestor1.id },
    create: {
      id: "colab1",
      name: "Colaborador Um",
      email: "colaborador1@empresa.com",
      passwordHash: senhaHash,
      role: "FUNCIONARIO",
      managerId: "gestor1",
    },
  });

  // Colaborador Dois — reporta ao Gestor Dois; hireDate 2024-02-14 (≈2 anos → 60 dias)
  const hireDateColab2 = new Date("2024-02-14T14:55:36.091Z");
  await prisma.user.upsert({
    where: { email: "colaborador2@empresa.com" },
    update: {
      name: "Colaborador Dois",
      role: "FUNCIONARIO",
      passwordHash: senhaHash,
      managerId: gestor2.id,
      hireDate: hireDateColab2,
    },
    create: {
      id: "colab2",
      name: "Colaborador Dois",
      email: "colaborador2@empresa.com",
      passwordHash: senhaHash,
      role: "FUNCIONARIO",
      managerId: "gestor2",
      hireDate: hireDateColab2,
    },
  });

  console.log("Seed concluído. Senha para todos: senha123");
  console.log("Estrutura (conforme sua tabela User):");
  console.log("  Gestores (COORDENADOR): gestor1@empresa.com, gestor2@empresa.com");
  console.log("  Gerentes: gerente1@empresa.com, gerente2@empresa.com");
  console.log("  RH: rh1@empresa.com, rh2@empresa.com");
  console.log("  Colaboradores: colaborador1@empresa.com (gestor1), colaborador2@empresa.com (gestor2)");
  console.log("  Colab2 hireDate:", hireDateColab2.toISOString().slice(0, 10), "→ 60 dias no ciclo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
