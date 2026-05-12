## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [CSV Formula Injection em Relatórios Exportados]
**Vulnerabilidade:** Múltiplos endpoints de exportação CSV (`vacation-requests/export`, `reports/balance`, `reports/adherence`, `reports/acquisition-periods`) não sanitizavam os dados controlados pelo usuário (nome, email, departamento, etc.). Isso permitia que um atacante injetasse fórmulas nocivas como `=cmd|' /C calc'!A0`, resultando em execução de código (RCE) caso o arquivo CSV fosse aberto no Microsoft Excel ou outro software de planilha por um administrador (RH ou gestor).
**Learning:** O uso de separadores de campo corretos (`;`) resolve a integridade estrutural do CSV, mas não protege o aplicativo leitor final (Excel, Calc) das planilhas geradas de conteúdos dinâmicos que começam com `=`, `+`, `-`, `@`, `\t`, e `\r`. Adicionar um helper sanitizador em um projeto que já exporta CSV massivamente é uma correção obrigatória.
**Prevention:** Qualquer dado renderizado em arquivos formatados para software de planilha (CSV/TSV) deve ser envolvido pelo utilitário `escapeCsvFormulas()` adicionado em `lib/csv.ts`, o qual prefixa os caracteres iniciais perigosos com `'` e, no contexto atual do projeto que usa `;` como separador, substitui internamente `;` por `,`.

## 2026-05-15 - [Exposição de Dados Sensíveis via Prisma Update]
**Vulnerabilidade:** A rota de atualização de usuário no Backoffice (`PATCH /api/users/[id]`) retornava implicitamente todos os campos do modelo `User` definidos no Prisma, incluindo `passwordHash` e o campo sensível `mustChangePassword`, devido à ausência de um bloco explícito de `select` na chamada de atualização `prisma.user.update`.
**Learning:** Por padrão, o Prisma retorna a totalidade dos campos de um modelo numa operação `create` ou `update`. Qualquer atualização de banco que repasse seu resultado diretamente para a resposta JSON da API exporá hashes de senha e outras credenciais internas se os campos não forem estritamente controlados.
**Prevention:** Todas as respostas da API de manipulação do Prisma (`create`, `update`, `findUnique`) devem usar blocos `select` explícitos. Além disso, testes de unidade mockando os métodos do Prisma devem validar aspasertivamente que `expect(prisma.modelo.metodo).toHaveBeenCalledWith(expect.objectContaining({ select: ... }))` está ativada.
