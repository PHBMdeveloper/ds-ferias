## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [CSV and Formula Injection Vulnerability]
**Vulnerabilidade:** A exportação de dados para relatórios CSV (como `balance`, `adherence`, `acquisition-periods` e `export`) não validava se o conteúdo das strings começava com operadores de fórmulas (`=`, `+`, `-`, `@`, etc), o que podia levar a execução remota de código (RCE) via Formula Injection (CSV Injection) quando o arquivo fosse aberto no Excel ou outra planilha. Além disso, os campos continham apenas reposições limitadas, o que podia causar quebra de estrutura com novas linhas (Row Injection).
**Learning:** Dados fornecidos pelo usuário ou banco de dados que vão parar em planilhas precisam ser fortemente higienizados contra prefixos que representam macros e caracteres de controle (novas linhas), e não apenas o separador padrão do CSV.
**Prevention:** Todos os campos gerados em CSVs a partir de dados não estruturados devem passar pela função utilitária unificada `escapeCsvFormulas`, que neutraliza injetores de macro prefixando uma aspa simples `'`, substitui quebras de linha e remove/escapa os separadores (como `;`).
