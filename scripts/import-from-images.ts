import "dotenv/config";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

type RawRow = {
  registration: string;
  name: string;
  startDate: string; // dd/mm/yyyy
  days: number;
  adto13: boolean;
  abono10: boolean;
  managerName: string;
};

const rows: RawRow[] = [
  { registration: "283466", name: "CAIQUE LOURENCO MOREIRA", startDate: "13/10/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "284951", name: "ELIAS SEIXAS LOROSA NETO", startDate: "08/09/2026", days: 15, adto13: false, abono10: false, managerName: "FABIO ALESSANDRO MARCIANO" },
  { registration: "283547", name: "FELIPE DOMINGUITO REZENDE", startDate: "08/06/2026", days: 20, adto13: false, abono10: true, managerName: "ADRIANO TURONE" },
  { registration: "284275", name: "GIOVANI CANOVA FOLTRAN", startDate: "10/08/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "282749", name: "LEANDRO DELLA SANTA MATTEUCCI", startDate: "19/10/2026", days: 20, adto13: false, abono10: true, managerName: "ADRIANO TURONE" },
  { registration: "283991", name: "MARLON YURI DE JESUS FERREIRA", startDate: "23/06/2026", days: 20, adto13: false, abono10: false, managerName: "DIOGO CARDOSO NERIS" },
  { registration: "283024", name: "PAULO HENRIQUE BERNARDES MARTINS", startDate: "09/09/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "283807", name: "RENAN DE OLIVEIRA", startDate: "13/07/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "109930", name: "WASHINGTON AKIHITO KONNO", startDate: "15/10/2026", days: 20, adto13: true, abono10: true, managerName: "FABIO ALESSANDRO MARCIANO" },
  { registration: "282994", name: "WILLIAM PAULO DE OLIVEIRA", startDate: "01/07/2026", days: 15, adto13: false, abono10: false, managerName: "ADRIANO TURONE" },
  { registration: "282994", name: "WILLIAM PAULO DE OLIVEIRA", startDate: "01/11/2026", days: 20, adto13: false, abono10: true, managerName: "ADRIANO TURONE" },
  // Complemento da segunda imagem
  { registration: "283466", name: "CAIQUE LOURENCO MOREIRA", startDate: "28/12/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "283547", name: "FELIPE DOMINGUITO REZENDE", startDate: "14/09/2026", days: 20, adto13: false, abono10: true, managerName: "ADRIANO TURONE" },
  { registration: "282749", name: "LEANDRO DELLA SANTA MATTEUCCI", startDate: "13/07/2026", days: 15, adto13: false, abono10: true, managerName: "ADRIANO TURONE" },
  { registration: "282749", name: "LEANDRO DELLA SANTA MATTEUCCI", startDate: "04/01/2027", days: 5, adto13: false, abono10: false, managerName: "ADRIANO TURONE" },
  { registration: "283807", name: "RENAN DE OLIVEIRA", startDate: "18/05/2026", days: 20, adto13: false, abono10: true, managerName: "RAPHAEL RAPPOLI" },
  { registration: "282994", name: "WILLIAM PAULO DE OLIVEIRA", startDate: "08/06/2026", days: 15, adto13: false, abono10: false, managerName: "ADRIANO TURONE" },
];

function parseBrDate(value: string): Date {
  const [d, m, y] = value.split("/").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definida.");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = hashPassword("senha123");
  const defaultHireDate = new Date("2023-01-01T00:00:00Z");

  // RH base
  const rh = await prisma.user.create({
    data: {
      name: "RH Importacao",
      email: "rh.importacao@empresa.com",
      passwordHash,
      role: "RH",
      registration: "REG-RH-IMPORT",
      hireDate: defaultHireDate,
    },
  });

  // Gestores
  const managerNames = Array.from(new Set(rows.map((r) => r.managerName)));
  const managerByName = new Map<string, string>();
  for (const managerName of managerNames) {
    const manager = await prisma.user.create({
      data: {
        name: managerName,
        email: `${normalizeName(managerName)}@empresa.com`,
        passwordHash,
        role: "COORDENADOR",
        registration: `GEST-${normalizeName(managerName).toUpperCase().slice(0, 12)}`,
        managerId: rh.id,
        hireDate: defaultHireDate,
      },
    });
    managerByName.set(managerName, manager.id);
  }

  // Colaboradores únicos
  const employeeMap = new Map<string, { id: string; name: string }>();
  const byRegistration = new Map<string, RawRow>();
  for (const r of rows) if (!byRegistration.has(r.registration)) byRegistration.set(r.registration, r);

  for (const [registration, sample] of byRegistration.entries()) {
    const employee = await prisma.user.create({
      data: {
        name: sample.name,
        email: `${normalizeName(sample.name)}.${registration}@empresa.com`,
        passwordHash,
        role: "FUNCIONARIO",
        registration,
        managerId: managerByName.get(sample.managerName),
        hireDate: defaultHireDate,
      },
    });
    employeeMap.set(registration, { id: employee.id, name: employee.name });
  }

  // Solicitações de férias aprovadas
  let createdRequests = 0;
  const seen = new Set<string>();
  for (const r of rows) {
    const employee = employeeMap.get(r.registration);
    if (!employee) continue;
    const start = parseBrDate(r.startDate);
    const end = addDays(start, r.days - 1);
    const key = `${r.registration}|${start.toISOString().slice(0, 10)}|${r.days}|${r.abono10 ? "A" : "N"}|${r.adto13 ? "S" : "N"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    await prisma.vacationRequest.create({
      data: {
        userId: employee.id,
        startDate: start,
        endDate: end,
        status: "APROVADO_COORDENADOR",
        thirteenth: r.adto13,
        abono: r.abono10,
        notes: "Importado da planilha (imagens fornecidas).",
      },
    });
    createdRequests += 1;
  }

  console.log("Importação concluída.");
  console.log(`Gestores criados: ${managerNames.length}`);
  console.log(`Colaboradores criados: ${employeeMap.size}`);
  console.log(`Solicitações criadas: ${createdRequests}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Falha na importação:", err);
  process.exit(1);
});

