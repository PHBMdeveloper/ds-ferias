/**
 * Seed com hierarquia correta para a aba Times:
 * RH → Gerente → Coordenador → Colaborador (FUNCIONARIO)
 *
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

  // ---- RH (topo da hierarquia para aprovação; sem manager ou reporta a gerente) ----
  const rh1 = await prisma.user.upsert({
    where: { email: "rh1@empresa.com" },
    update: { name: "RH Um", role: "RH", passwordHash: senhaHash, registration: "REG-RH1" },
    create: {
      id: "rh1",
      name: "RH Um",
      email: "rh1@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
      registration: "REG-RH1",
    },
  });

  // ---- GERENTES (reportam ao RH) ----
  const gerente1 = await prisma.user.upsert({
    where: { email: "gerente1@empresa.com" },
    update: { name: "Gerente Um", role: "GERENTE", passwordHash: senhaHash, managerId: rh1.id, registration: "REG-GER1" },
    create: {
      id: "gerente1",
      name: "Gerente Um",
      email: "gerente1@empresa.com",
      passwordHash: senhaHash,
      role: "GERENTE",
      managerId: rh1.id,
      registration: "REG-GER1",
    },
  });

  const gerente2 = await prisma.user.upsert({
    where: { email: "gerente2@empresa.com" },
    update: { name: "Gerente Dois", role: "GERENTE", passwordHash: senhaHash, managerId: rh1.id, registration: "REG-GER2" },
    create: {
      id: "gerente2",
      name: "Gerente Dois",
      email: "gerente2@empresa.com",
      passwordHash: senhaHash,
      role: "GERENTE",
      managerId: rh1.id,
      registration: "REG-GER2",
    },
  });

  // ---- COORDENADORES (reportam ao Gerente) ----
  const gestor1 = await prisma.user.upsert({
    where: { email: "gestor1@empresa.com" },
    update: { name: "Gestor Um", role: "COORDENADOR", passwordHash: senhaHash, managerId: gerente1.id, registration: "REG-GES1" },
    create: {
      id: "gestor1",
      name: "Gestor Um",
      email: "gestor1@empresa.com",
      passwordHash: senhaHash,
      role: "COORDENADOR",
      managerId: gerente1.id,
      registration: "REG-GES1",
    },
  });

  const gestor2 = await prisma.user.upsert({
    where: { email: "gestor2@empresa.com" },
    update: { name: "Gestor Dois", role: "COORDENADOR", passwordHash: senhaHash, managerId: gerente1.id, registration: "REG-GES2" },
    create: {
      id: "gestor2",
      name: "Gestor Dois",
      email: "gestor2@empresa.com",
      passwordHash: senhaHash,
      role: "COORDENADOR",
      managerId: gerente1.id,
      registration: "REG-GES2",
    },
  });

  // ---- COLABORADORES / FUNCIONÁRIOS ----
  // 10 colaboradores no Gestor Um, divididos em dois times:
  // - Plataforma (5)
  // - Design System (5)
  const colaboradores = [
    { n: 1, nome: "Colaborador Um", time: "Plataforma", hireDate: "2023-06-01" },
    { n: 2, nome: "Colaborador Dois", time: "Plataforma", hireDate: "2023-07-10" },
    { n: 3, nome: "Colaboradora Três", time: "Plataforma", hireDate: "2023-08-15" },
    { n: 4, nome: "Colaborador Quatro", time: "Plataforma", hireDate: "2023-09-20" },
    { n: 5, nome: "Colaboradora Cinco", time: "Plataforma", hireDate: "2023-10-25" },
    { n: 6, nome: "Colaborador Seis", time: "Design System", hireDate: "2023-11-05" },
    { n: 7, nome: "Colaboradora Sete", time: "Design System", hireDate: "2023-12-12" },
    { n: 8, nome: "Colaborador Oito", time: "Design System", hireDate: "2024-01-18" },
    { n: 9, nome: "Colaboradora Nove", time: "Design System", hireDate: "2024-02-22" },
    { n: 10, nome: "Colaborador Dez", time: "Design System", hireDate: "2024-03-15" },
  ] as const;

  for (const c of colaboradores) {
    const email = `colaborador${c.n}@empresa.com`;
    const registration = `REG-COL${c.n}`;
    await prisma.user.upsert({
      where: { email },
      update: {
        name: c.nome,
        role: "FUNCIONARIO",
        passwordHash: senhaHash,
        managerId: gestor1.id,
        department: "Engenharia",
        team: c.time,
        hireDate: new Date(c.hireDate),
        registration,
      },
      create: {
        id: `colab${c.n}`,
        name: c.nome,
        email,
        passwordHash: senhaHash,
        role: "FUNCIONARIO",
        managerId: gestor1.id,
        department: "Engenharia",
        team: c.time,
        hireDate: new Date(c.hireDate),
        registration,
      },
    });
  }

  // RH Dois (opcional, para testes)
  await prisma.user.upsert({
    where: { email: "rh2@empresa.com" },
    update: { name: "RH Dois", role: "RH", passwordHash: senhaHash, registration: "REG-RH2" },
    create: {
      id: "rh2",
      name: "RH Dois",
      email: "rh2@empresa.com",
      passwordHash: senhaHash,
      role: "RH",
      registration: "REG-RH2",
    },
  });

  console.log("Seed concluído. Senha para todos: senha123");
  console.log("");
  console.log("Hierarquia (para a aba Times):");
  console.log("  RH → Gerente → Coordenador → Colaborador");
  console.log("  rh1 (RH)");
  console.log("  ├── gerente1 (GERENTE)");
  console.log("  │   ├── gestor1 (COORDENADOR) → colab1..colab10");
  console.log("  │   │    ├── time: Plataforma (5)");
  console.log("  │   │    └── time: Design System (5)");
  console.log("  │   └── gestor2 (COORDENADOR)");
  console.log("  └── gerente2 (GERENTE)");
  console.log("");
  console.log("Logins para testar Times:");
  console.log("  Coordenador (vê seu time):     gestor1@empresa.com  ou  gestor2@empresa.com");
  console.log("  Gerente (vê times dos coords): gerente1@empresa.com");
  console.log("  RH (vê todos):                rh1@empresa.com");
  console.log("  Colaborador:                   colaborador1@empresa.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
