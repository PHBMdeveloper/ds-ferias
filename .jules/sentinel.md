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

## 2026-04-18 - [Error Logging Information Disclosure]
**Vulnerability:** Raw error objects or stack traces could be exposed to standard output or log ingestors because handlers used `console.error(\"Erro: \", error)`.
**Learning:** In a production environment, directly logging uncaught exception objects without sanitization can expose sensitive application structure, database query details, or internal module paths.
**Prevention:** Errors must be explicitly coerced and logged using the structured `logger.error` mechanism (e.g., `logger.error(\"Message\", { error: String(error) })`) to prevent arbitrary object serialization and stack trace leakage.
