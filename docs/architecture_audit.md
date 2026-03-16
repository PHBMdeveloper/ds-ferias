# Architecture Audit — Editora Globo Férias

## 1. Visão geral da arquitetura

- **Frontend/Backend unificado:** Next.js 16 (App Router) com rotas de página e rotas API no mesmo projeto.
- **Camadas principais:**
  - `app/` (páginas + HTTP) — autenticação/autorização, parse de entrada, resposta HTTP.
  - `services/` (orquestração) — composição de regras de negócio e queries.
  - `repositories/` (dados) — acesso a Prisma e ao schema relacional.
  - `lib/` (domínio e cross-cutting) — regras CLT, hierarquia, visibilidade, auth, logging, rate limit.
  - `components/` (UI) — componentes de dashboard, requests, layout.

Essa separação está bem definida e já evita que páginas acessem Prisma diretamente na maior parte dos casos.

---

## 2. Pontos fortes

- **Páginas finas:** `app/dashboard/page.tsx` e `app/admin/page.tsx` delegam praticamente tudo a services/repos.
- **Regras de negócio centralizadas:** `lib/vacationRules.ts` e `lib/requestVisibility.ts` são a fonte única de verdade para CLT, hierarquia e visibilidade.
- **Repositories coerentes:** `userRepository`, `vacationRepository`, `blackoutRepository` encapsulam queries complexas com `include`/`select` adequados.
- **Services orientados a cenário:**
  - `dashboardDataService` para o dashboard por papel;
  - `teamMembersService` para a aba Times;
  - `vacationRequestListService` para listagem/export.

---

## 3. Pontos fracos / riscos

- **Módulo de domínio monolítico:**
  - `lib/vacationRules.ts` concentra muitas responsabilidades (roles, CLT, saldo, conflitos, feriados) em um único arquivo grande.
  - Isso dificulta evolução incremental (ex.: novas políticas por departamento) e leitura por parte de novos devs.
- **Ausência de camada de domínio explícita:**
  - Não há `domain/` com entidades e use cases; services falam diretamente com Prisma via repositories.
  - As invariantes de domínio estão embutidas nas funções utilitárias, não em objetos de domínio.
- **Algumas rotas ainda misturam domínio/dados:**
  - `api/vacation-requests/route.ts` ainda contém a função `hasOverlappingRequest` local em vez de chamar um serviço dedicado de overlap.

---

## 4. Recomendações arquiteturais

1. **Modularizar `vacationRules.ts` (curto/médio prazo)**
   - Separar em submódulos `roles`, `balance`, `validation`, `holidays`, `teamVisibility`, reexportando via `index.ts`.
   - Benefício: facilita testes focados e entendimento por área de regra.

2. **Introduzir camada de domínio (médio/longo prazo)**
   - Criar `domain/` com entidades (VacationRequest, User, Team) e use cases (`CreateVacationRequest`, `ApproveVacationRequest`, etc.).
   - Services passariam a orquestrar use cases em vez de chamar diretamente `vacationRules` + repos.

3. **Service dedicado para overlap**
   - Extrair `hasOverlappingRequest` para um service ou função de domínio (`VacationOverlapService`) reutilizável nas rotas de criação e update.

Essas recomendações estão refletidas também em `docs/next_steps.md`.

