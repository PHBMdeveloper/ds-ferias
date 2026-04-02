## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [CSV Formula Injection in User Reports]
**Vulnerability:** User-controlled inputs (names, emails, departments) were directly concatenated into CSV exports. A malicious user could input values starting with `=`, `+`, `-`, or `@` to execute arbitrary formulas or commands when an admin opens the CSV in Excel or Google Sheets. Additionally, unescaped newlines and semicolons allowed row/cell injection.
**Learning:** Even internal admin tools generating CSVs must sanitize user data, as CSV exports are inherently untrusted when read by spreadsheet software.
**Prevention:** Implement a central utility (`escapeCsvFormulas`) that sanitizes newlines, replaces the CSV delimiter (e.g., semicolons) to prevent injection, and explicitly escapes values starting with formula trigger characters by prepending a single quote (`'`). Apply this utility to all user-controlled data embedded in CSVs.
