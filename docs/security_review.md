# Security Review — Editora Globo Férias

## 1. Autenticação

- Login via rota API dedicada, com hash de senha e sessão via cookie HTTP-only (detalhado em `docs/architecture.md`).
- Rate limit aplicado ao login (10 req/min por IP) reduz brute-force.

## 2. Autorização e permissões

- **Pontos fortes:**
  - Uso centralizado de `getRoleLevel` e `hasTeamVisibility` para checagem de acesso em múltiplas rotas.
  - Rotas sensíveis (update de férias, relatórios RH) checam explicitamente papel e visibilidade de time.
  - Colaborador não consegue mais editar a própria solicitação de férias; somente gestores/RH com visibilidade adequada.
- **Riscos remanescentes:**
  - É fundamental manter todas as checagens de autorização no backend; nunca confiar apenas em esconder botões na UI.

## 3. Validação e sanitização

- **Entrada:**
  - Validação de CUID em rotas dinâmicas (`[id]`) para evitar queries desnecessárias/broken IDs.
  - Validação CLT robusta em `validateCltPeriods` e cálculo de saldo em `calculateVacationBalance`.
  - Verificações de tipo para payload de login e criação de férias.
- **Melhorias possíveis:**
  - Introduzir um esquema de validação declarativo (ex.: Zod) para corpos de requisição de rotas principais (login, criação de férias, update, admin).

## 4. Exposição de dados sensíveis

- Todas as respostas API parecem limitar os campos retornados (`select`/`include` bem definidos).
- Relatórios CSV incluem apenas informações necessárias para gestão de férias.

## 5. Recomendação de melhorias

1. **Validação baseada em schema para API** (alto impacto, média complexidade)
   - Criar esquemas de entrada para cada rota crítica (`login`, `vacation-requests` POST/UPDATE, admin CRUD) com mensagens consistentes.

2. **Auditoria de ações sensíveis** (médio impacto, baixa complexidade)
   - Reutilizar o `logger` para registrar aprovações, reprovações, cancelamentos e alterações manuais, com `userId`, `requestId` e IP.

3. **Segurança de sessão** (médio impacto, baixa complexidade)
   - Garantir flags `Secure`, `HttpOnly`, `SameSite` adequadas para o cookie de sessão (já descritas em docs, mas importante validar config final em produção).

