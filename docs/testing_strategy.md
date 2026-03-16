# Testing Strategy — Editora Globo Férias

## 1. Estado atual

- Suite de testes em `tests/` com foco em:
  - Regras CLT (`vacationRules.test.ts`).
  - Workflows de aprovação (`workflows.test.ts`).
  - Visibilidade e filtros (`dashboardFilters`, `requestVisibility`).
  - Services (`dashboardDataService`, `teamMembersService`, `vacationRequestListService`).
  - Infra cross-cutting (`logger`, `rateLimit`, `auth`, `notifications`, `utils`).
- Cobertura-alvo: **90%** com Vitest.
- Stryker configurado com score mínimo de **85%**.

## 2. Estratégia recomendada

1. **Testes de domínio (prioridade alta)**
   - Garantir 100% de cobertura em `vacationRules` (clt, balance, holidays, visibility) com casos limites.
   - Cobrir cenários de sobreposição de períodos, aviso prévio, fracionamento.

2. **Testes de serviços (alta)**
   - `dashboardDataService`, `teamMembersService`, `vacationRequestListService` já possuem testes; manter e expandir para novos filtros.

3. **Testes de API (média)**
   - Usar Vitest + `fetch` mockado para testar rotas API críticas:
     - Criação de férias (`/api/vacation-requests` POST) — happy path + erros CLT + blackout.
     - Aprovação/reprovação/cancelamento — checando mudanças em `status` e `history`.
     - Relatórios — formato e conteúdo básico do CSV.

4. **Testes de UI críticos (média)**
   - Componentes puramente de apresentação podem ser testados de forma mais leve.
   - Foco maior em componentes com lógica: `NewRequestCardClient`, `EditPeriodFormClient`, `TimesViewClient`.

5. **Mutation testing (média)**
   - Priorizar módulos de domínio e serviços no escopo do Stryker.

