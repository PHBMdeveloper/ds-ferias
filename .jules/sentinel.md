## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.
## 2026-05-15 - [Formula Injection em Relatórios CSV]
**Vulnerabilidade:** Os endpoints de exportação CSV (/api/reports/ e /api/vacation-requests/export/) não sanitizavam entradas controladas pelo usuário (como nomes, e-mails, departamentos e histórico de status) antes de incorporá-las no arquivo CSV gerado.
**Learning:** Entradas maliciosas que iniciam com caracteres como =, +, -, ou @ poderiam ser interpretadas como fórmulas se o arquivo CSV for aberto em softwares de planilhas eletrônicas, levando à injeção de fórmulas (CSV Injection) que poderia resultar em execução arbitrária de código ou exfiltração de dados.
**Prevention:** Utilizar a função escapeCsvFormulas implementada em @/lib/csv para prefixar valores perigosos com um apóstrofo ('), neutralizando a interpretação automática como fórmula.
