/**
 * Seed do banco: cria/atualiza usuários de teste.
 * - Colaborador 1 e 2 (FUNCIONARIO); Colaborador 2 com hireDate ~2 anos → 60 dias.
 * - Gestores: gestor@ (COORDENADOR), gestor2@ (GERENTE).
 * - RH: rh@, rh2@.
 * Senha padrão para todos: senha123
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

  const hoje = new Date();
  const doisAnosAtras = new Date(hoje);
  doisAnosAtras.setMonth(doisAnosAtras.getMonth() - 25);

  // Gestor Líder (1ª etapa de aprovação)
  const gestor = await prisma.user.upsert({
    where: { email: "gestor@empresa.com" },
    update: { name: "Gestor Líder", role: "COORDENADOR", passwordHash: senhaHash },
    create: {
      name: "Gestor Líder",
      email: "gestor@empresa.com",
      passwordHash: senhaHash,
      role: "COORDENADOR",
    },
  });

  // Gestor Projeto (2ª etapa de aprovação)
  const gestor2 = await prisma.user.upsert({
    where: { email: "gestor2@empresa.com" },
    update: { name: "Gestor Projeto", role: "GERENTE", passwordHash: senhaHash },
    create: {
      name: "Gestor Projeto",
      email: "gestor2@empresa.com",
      passwordHash: senhaHash,
      role: "GERENTE",
    },
  });

  // RH
  await prisma.user.upsert({
    where: { email: "rh@empresa.com" },
    update: { name: "RH Master", role: "RH", passwordHash: senhaHash },
    create: {
      name: "RH Master",
      email: "rh@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
    },
  });

  await prisma.user.upsert({
    where: { email: "rh2@empresa.com" },
    update: { name: "RH Operacional", role: "RH", passwordHash: senhaHash },
    create: {
      name: "RH Operacional",
      email: "rh2@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
    },
  });

  // Colaborador 1
  await prisma.user.upsert({
    where: { email: "colaborador1@empresa.com" },
    update: { name: "Colaborador Um", role: "FUNCIONARIO", passwordHash: senhaHash, managerId: gestor.id },
    create: {
      name: "Colaborador Um",
      email: "colaborador1@empresa.com",
      passwordHash: senhaHash,
      role: "FUNCIONARIO",
      managerId: gestor.id,
    },
  });

  // Colaborador 2: quase 2 anos de empresa → 60 dias (2 períodos)
  const colaborador2 = await prisma.user.upsert({
    where: { email: "colaborador2@empresa.com" },
    update: {
      name: "Colaborador Dois",
      role: "FUNCIONARIO",
      hireDate: doisAnosAtras,
      passwordHash: senhaHash,
      managerId: gestor.id,
    },
    create: {
      name: "Colaborador Dois",
      email: "colaborador2@empresa.com",
      passwordHash: senhaHash,
      role: "FUNCIONARIO",
      hireDate: doisAnosAtras,
      managerId: gestor.id,
    },
  });

  console.log("Seed concluído. Senha para todos: senha123");
  console.log("Gestores:", gestor.email, "(COORDENADOR),", gestor2.email, "(GERENTE)");
  console.log("RH: rh@empresa.com, rh2@empresa.com");
  console.log("Colaboradores: colaborador1@empresa.com, colaborador2@empresa.com | Colaborador 2 admissão:", doisAnosAtras.toISOString().slice(0, 10), "→ 60 dias");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
