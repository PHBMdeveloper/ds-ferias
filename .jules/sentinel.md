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
## 2026-04-23 - [Segurança de Logs: console.error vs logger.error]
**Vulnerabilidade:** Algumas rotas (, , etc.) utilizavam  de forma não estruturada, dificultando o monitoramento e quebrando o padrão do projeto que requer o uso do pacote .
**Learning:** O wrapper de logging () garante que os logs sejam formatados de forma centralizada e previsível no ambiente (em produção). No entanto, é importante **não** aplicar transformações redutoras (como ) ao passar as mensagens para o backend logger, a fim de garantir a manutenção das stack traces para debugar as falhas no servidor. Logs para a tela ou cliente sim devem não expor a stack trace.
**Prevention:** Qualquer tratativa de falhas (como  no express/next.js) deve usar  injetando o objeto original no contexto de opções e responder ao cliente de forma higienizada.
## 2026-05-15 - [Segurança de Logs: console.error vs logger.error]
**Vulnerabilidade:** Algumas rotas (`app/api/health/route.ts`, `app/api/admin/feedbacks/route.ts`, etc.) utilizavam `console.error` de forma não estruturada.
**Learning:** O wrapper de logging (`logger.error`) garante que os logs sejam formatados de forma centralizada e estruturada. No entanto, é crítico NÃO converter o erro (`String(error)`) antes de passá-lo ao logger do servidor, sob pena de perder a stack trace original essencial para troubleshooting.
**Prevention:** As rotas devem sempre utilizar `logger.error("mensagem", { error })` injetando o objeto original completo e formatar as respostas ao cliente para omitir detalhes técnicos (fail securely).
