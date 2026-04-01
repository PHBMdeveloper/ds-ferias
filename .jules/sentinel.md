## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [CSV Formula Injection Prevention]
**Vulnerabilidade:** A aplicação exportava dados controlados pelos usuários (nomes, e-mails, departamentos) em arquivos CSV sem sanitizar campos que pudessem iniciar com caracteres de injeção de fórmulas (`=`, `+`, `-`, `@`, `\t`, `\r`).
**Learning:** Dados de entrada arbitrários podem ser utilizados para executar comandos na máquina do usuário quando o CSV é aberto em softwares de planilha. Além disso, as quebras de linha precisam ser removidas/substituídas para impedir a injeção de novas linhas de registros ("row injection").
**Prevention:** Todos os campos de texto não estruturados enviados para arquivos CSV devem ser sanitizados antecipando uma aspa simples (`'`) a campos perigosos e removendo quebras de linha (`\n`, `\r`). O método `escapeCsvFormulas` em `lib/csv.ts` foi criado e deve ser utilizado de forma consistente.
