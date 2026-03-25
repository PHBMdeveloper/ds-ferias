## 2026-05-15 - [Bypass de Autenticação por Falta de Assinatura]
**Vulnerabilidade:** Um cookie de sessão sem assinatura podia ignorar a verificação de segurança se não contivesse um ponto (`.`), mesmo quando `SESSION_SECRET` estava configurado.
**Learning:** A verificação de assinatura dependia da presença do caractere separador no cookie bruto, permitindo que atacantes enviassem payloads JSON puros para contornar a proteção HMAC.
**Prevention:** Sempre exigir e verificar a assinatura se o segredo estiver configurado, independentemente do formato da entrada.

## 2026-05-15 - [Migração de Hashing de Senha]
**Vulnerabilidade:** O uso de SHA-256 sem salt tornava as senhas vulneráveis a ataques de dicionário e rainbow tables.
**Learning:** O README já recomendava a migração para algo mais seguro. Implementar `scrypt` com salt aleatório e manter fallback para SHA-256 garante segurança para novos usuários sem quebrar o acesso dos antigos.
**Prevention:** Usar algoritmos de hashing com fator de trabalho (scrypt, bcrypt, argon2) e salts únicos por usuário.

## 2026-05-15 - [CSV Formula Injection (Excel)]
**Vulnerabilidade:** Relatórios CSV inseriam nomes e emails diretamente nas células sem sanitização. Valores iniciados com `=`, `+`, `-` ou `@` poderiam ser executados como fórmulas se abertos no Microsoft Excel.
**Learning:** Dados fornecidos pelo usuário não podem ser confiados nem mesmo em exportações de texto simples se o destino provável do arquivo os tratar ativamente (como no caso do Excel).
**Prevention:** Criar e usar um utilitário de sanitização para "escapar" fórmulas prefixando entradas com aspas simples (`'`) sempre que o dado do usuário for exportado para CSV.
