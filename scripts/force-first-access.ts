import { prisma } from "../lib/prisma";
import { hashNewUserPassword } from "../lib/auth";

async function main() {
  console.log("Iniciando atualização de usuários (Primeiro Acesso + Senha Padrão)...");
  
  // Gera o hash para a senha 'senha123'
  const newHash = hashNewUserPassword("senha123");

  const result = await prisma.user.updateMany({
    data: {
      mustChangePassword: true,
      passwordHash: newHash,
    },
  });

  console.log(`Sucesso! ${result.count} usuários configurados.`);
  console.log("Configurações aplicadas:");
  console.log("- Primeiro acesso: ATIVO (troca de senha obrigatória)");
  console.log("- Senha padrão definida para: senha123");
}

main()
  .catch((e) => {
    console.error("Erro ao atualizar usuários:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
