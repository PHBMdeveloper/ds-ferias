# Architecture — Editora Globo Férias

---

## 1. Visão geral

- **Frontend/Backend:** Next.js 16 (App Router) rodando em modo fullstack (React server components + rotas API).
- **Persistência:** Prisma 7 com PostgreSQL.
- **UI:** TailwindCSS, shadcn/ui, Sonner para toasts.
- **Camadas principais:**
  - `app/` — páginas e rotas API (camada de aplicação).
  - `components/` — UI por domínio.
  - `services/` — orquestração de regras de negócio.
  - `repositories/` — acesso a dados com Prisma.
  - `lib/` — regras de negócio e utilitários cross-cutting.

A filosofia atual é de **rotas finas**, com autenticação/autorização + I/O, delegando a services e repositories.

---

## 2. Camada de aplicação (`app/`)

### 2.1 Páginas

- `app/login/page.tsx` — fluxo de login com loading e toasts; chama `POST /api/login`.
- `app/dashboard/page.tsx` — dashboard principal; resolve `searchParams`, chama `getDashboardData`, `getTeamMembersForTimes`, `getCurrentUserBalance`, `getCurrentUserDepartment` e repassa dados a componentes (`MyRequestsList`, `ManagerView`, `TimesView`).
- `app/admin/page.tsx` — backoffice de usuários; usa `findAllUsersForAdmin`/`findManagersForAdmin` do `userRepository`.

### 2.2 Rotas API (principais)

- Autenticação:
  - `api/login` — valida credenciais via `verifyCredentials`, cria sessão via `createSession` e aplica rate limit por IP.
  - `api/logout` — destrói sessão.
- Férias:
  - `api/vacation-requests` — GET (listagem por papel) e POST (criação com validações CLT, blackout, saldo e overlap).
  - `api/vacation-requests/[id]/approve|reject|delete|update` — operações sobre uma solicitação específica (aprovar, reprovar, cancelar/excluir, ajustar período pela gestão).
  - `api/vacation-requests/export` — export CSV de solicitações, alimentado por `vacationRequestListService`.
  - `api/vacation-balance` — expõe saldo de férias do usuário logado.
- Relatórios e apoio:
  - `api/reports/balance` — relatório CSV de saldo por colaborador (RH).
  - `api/reports/adherence` — relatório de adesão (quem tem direito mas não tirou férias no ano).
  - `api/blackout-periods` — lista períodos de blackout.
  - `api/health` — health check com verificação de DB.

As rotas validam sempre a sessão via `getSessionUser()` e retornam `{ error: string }` nas respostas 4xx.

---

## 3. Services

- `services/dashboardDataService.ts` — centraliza a montagem de dados para o dashboard:
  - usa `findMyRequests`, `findManagedRequests`, `findBlackouts`, `findUserWithBalance`, `findUserDepartment`;
  - aplica `buildManagedRequestsWhere` e `hasTeamVisibility` para saber o que mostrar a cada papel.
- `services/teamMembersService.ts` — constrói a visão de times para coordenador/gerente/RH:
  - consolida dados de `findTeamMembersByManager`, `findTeamMembersByGerente` e `findAllEmployees`;
  - associa saldo (`calculateVacationBalance`) e status "em férias agora".
- `services/vacationRequestListService.ts` — única fonte para listagem que alimenta o export:
  - monta `where` com `buildManagedRequestsWhere` e filtros por colaborador/departamento;
  - aplica `filterRequestsByVisibilityAndView` para respeitar visão (inbox/histórico) e papéis.

Services são functions puras orientadas a cenários, sem lógica de HTTP nem de UI.

---

## 4. Repositories

- `repositories/vacationRepository.ts` — encapsula queries de férias (minhas solicitações, gerenciadas).
- `repositories/userRepository.ts` — acesso a usuários para vários casos:
  - saldo por usuário (`findUserWithBalance`), departamento (`findUserDepartment`);
  - times de coordenador/gerente (`findTeamMembersByManager`, `findTeamMembersByGerente`, `findAllEmployees`);
  - backoffice (`findAllUsersForAdmin`, `findManagersForAdmin`);
  - relatórios (`findUsersWithVacationForBalance`).
- `repositories/blackoutRepository.ts` — períodos de blackout.

A camada de repositório evita que detalhes de Prisma se espalhem pelas rotas.

---

## 5. Regras de negócio (`lib/`)

- `vacationRules.ts` — núcleo de domínio:
  - hierarquia e permissões (`ROLE_LEVEL`, `ROLE_LABEL`, `getNextApprovalStatus`, `canApproveRequest`, `hasTeamVisibility`, `getApprovalSteps`, `getApprovalProgress`);
  - validações CLT (`validateCltPeriod`, `validateCltPeriods`), regras de feriados SP e DSR;
  - cálculo de saldo (`calculateVacationBalance`, `VacationBalance`); 
  - conflitos de equipe (`detectTeamConflicts`).
- `requestVisibility.ts` — construção de filtros de visibilidade e view (inbox/histórico).
- `dashboardFilters.ts` — normalização de filtros de dashboard e montagem de querystrings.
- `auth.ts` — autenticação/sessão (SHA-256 para senha, cookie com HMAC opcional).
- `logger.ts` — logger estruturado usado em login, aprovação, reprovação, export.
- `rateLimit.ts` — rate limit em memória por chave (IP ou userId).
- `notifications.ts` — envio de notificações via webhook.

Esses módulos são reutilizados em services, repositórios e componentes.

---

## 6. Considerações de evolução

- **Modularizar `vacationRules.ts`:** separar em submódulos (`roles`, `balance`, `validation`, `holidays`, `teamVisibility`) mantendo um `index.ts` como fachada.
- **Camada de domínio explícita:** futuramente, criar `domain/` com entidades e use cases para reduzir dependência direta de Prisma e de detalhes de Next.js.
- **Observabilidade:** integrar métricas e tracing ao redor das rotas mais críticas.

Essas ideias estão detalhadas em `docs/engineering_review.md` e `docs/next_steps.md` como recomendações de médio/longo prazo.

