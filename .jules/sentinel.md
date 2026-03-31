## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-03-31 - [Vulnerabilidade de Injeção de CSV (Formula Injection)]
**Vulnerabilidade:** Os valores de exportação para CSV de relatórios de férias, saldos, e adesão estavam sendo interpolados sem sanitização ou escape. Qualquer campo controlado por usuário (ex: nome, departamento, ou até campos textuais preenchidos incorretamente) iniciando com `=`, `+`, `-`, ou `@` podiam resultar em injeção de fórmulas e execução de código/scripts no Excel/LibreOffice do usuário que abrir a planilha exportada. Outro problema era injeção de linha usando \n ou \r.
**Learning:** Mesmo quando limitamos as funções a administradores ou RH, os dados (como nome, departamento e status) consumidos para CSV vêm dos usuários do sistema. Nunca confie que campos internos são seguros contra injeção de macro se o software do cliente vai interpretar a string. O utilitário central foi criado e importado uniformemente em vários endpoints e componentes.
**Prevention:** Todos os campos não numéricos que compõem o CSV devem ser sanitizados antes da serialização, prepended por um aspas simples (`'`) caso o primeiro caractere possibilite injeção de macro no Excel e substituindo quebras de linha (`\n`, `\r`) e o separador (`;`) para evitar row e delimiter injection.
