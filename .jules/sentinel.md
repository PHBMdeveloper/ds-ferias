## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [Prevenção de CSV/Formula Injection]
**Vulnerabilidade:** A geração de arquivos CSV de relatórios de RH e de Times concatenava strings controladas pelo usuário (nomes, cargos, departamentos) diretamente, criando o risco de injeção de fórmulas (CSV Injection) quando esses arquivos são abertos por sistemas como o Excel.
**Learning:** O simples uso de `.replace(/;/g, ",")` evita a quebra de colunas no formato CSV mas não impede que caracteres perigosos (como `=, +, -, @, \t, \r`) localizados no início das células sejam interpretados como funções executáveis em leitores de planilhas.
**Prevention:** Todos os campos gerados dinamicamente em outputs CSV devem ser sanitizados passando pelo utilitário `escapeCsvFormulas` da biblioteca `@/lib/csv`, a fim de prefixar aspas simples (`'`) a campos que iniciam com gatilhos de fórmula.
