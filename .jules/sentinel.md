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

## 2026-05-15 - [Stored XSS na API de Feedbacks]
**Vulnerabilidade:** A rota `/api/feedback` aceitava payloads arbitrários para o conteúdo e nome no feedback form, deixando-os salvos na base de dados de maneira insegura e suscetíveis a XSS caso fossem exibidos sem proteção (o que ocorreria no dashboard do admin). E a função de sanitização original (`sanitizeText`) apenas removia `<[^>]*>?`, o que é insuficiente.
**Learning:** O uso de regex simples para limpar tags HTML é vulnerável a uma série de ataques de XSS conhecidos (como `&lt;` em certos contextos, tags mal-formadas, ou injeção baseada em atributos caso o contexto permitisse). Adotou-se o modelo de "escaping" em vez de "stripping" no backend para evitar que qualquer código malicioso chegue ao banco de dados ou retorne para o admin.
**Prevention:** Todos os endpoints que recebem texto cru dos usuários devem passar pela função `sanitizeText` em `lib/validation.ts`, a qual foi reformulada para escapar as entidades HTML (`&`, `<`, `>`, `"`, `'`).
