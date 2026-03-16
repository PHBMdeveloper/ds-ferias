# Project Overview — Editora Globo Férias

Sistema interno de gestão de férias com fluxo de aprovação em cadeia (Coordenador → Gerente → RH), regras CLT e auditoria de mudanças.

---

## 1. Contexto e objetivos

- **Objetivo principal:** garantir que colaboradores, gestores e RH consigam planejar, aprovar e auditar férias seguindo as regras da CLT e políticas internas.
- **Usuários alvo:** colaboradores, coordenadores/gestores de equipe, gerentes, RH e eventualmente TI (monitoramento).
- **Requisitos-chave:**
  - Validação CLT (aviso prévio, fracionamento, DSR, feriados, saldo por ciclo).
  - Fluxo de aprovação em 3 níveis com histórico detalhado por mudança.
  - Controles de visibilidade por hierarquia (quem pode ver/agir sobre qual solicitação).
  - Relatórios e exportações (CSV, saldo de férias).

---

## 2. Arquitetura atual (alto nível)

- **Next.js 16 (App Router)** — Camada web (páginas, rotas API, server components).
- **Prisma 7 + PostgreSQL** — Acesso a dados e persistência.
- **TailwindCSS + shadcn/ui + Sonner** — UI, componentes e toasts.

Estrutura de pastas:

- `app/`
  - **Páginas:**
    - `login/` — autenticação.
    - `dashboard/` — visão principal por papel (Minhas Férias, Caixa de Aprovação, Histórico, Times).
    - `admin/` — backoffice para gerenciamento de usuários.
  - **APIs:**
    - `api/login` / `api/logout` — autenticação e sessão.
    - `api/vacation-requests` — CRUD de solicitações de férias.
    - `api/vacation-requests/[id]/approve|reject|delete|update` — ações por solicitação.
    - `api/vacation-requests/export` — export CSV das solicitações.
    - `api/vacation-balance` — saldo de férias.
    - `api/blackout-periods` — períodos de blackout.
    - `api/reports/balance` — relatório de saldo para RH.
    - `api/health` — health check.
- `components/`
  - `dashboard/` — Sidebar, TopBar, StatCards, TimesView, BlackoutAlert etc.
  - `requests/` — RequestCard, filtros, ManagerView, MyRequestsList, ações (aprovar, reprovar, cancelar, editar período pela gestão).
  - `layout/` — ExportButton, EmptyState, ícones.
  - `ui/` — Botão base, Alert etc.
- `lib/`
  - `vacationRules.ts` — regras de negócio centrais: CLT, hierarquia, visibilidade de time, saldo de férias, conflitos de equipe.
  - `requestVisibility.ts` — construção de `where` para aprovadores e filtro em memória por view (inbox/histórico) + filtros adicionais.
  - `dashboardFilters.ts` — filtros e querystring do dashboard.
  - `auth.ts` — sessão baseada em cookie HTTP-only com assinatura HMAC opcional; hash de senha SHA-256 (ponto de melhoria).
  - `logger.ts` — logging estruturado (JSON) com níveis info/warn/error.
  - `rateLimit.ts` — rate limit em memória (login e criação de solicitações).
  - `notifications.ts` — integração via webhook para eventos de férias.
  - `prisma.ts`, `utils.ts`, `validation.ts` — utilitários.
- `repositories/`
  - `vacationRepository.ts`, `userRepository.ts`, `blackoutRepository.ts` — encapsulam queries Prisma para cada agregado.
- `services/`
  - `dashboardDataService.ts` — orquestra dados do dashboard (minhas solicitações, solicitações gerenciadas, blackouts, saldo).
  - `teamMembersService.ts` — monta visão de times (coordenador, gerente, RH) com saldo e status atual.
  - `vacationRequestListService.ts` — fonte única para listagem/export de solicitações (usa `buildManagedRequestsWhere` + `filterRequestsByVisibilityAndView`).
- `types/`
  - `dashboard.ts` — tipos compartilhados para filtros e dados de times.

---

## 3. Módulos principais

### 3.1 Solicitações de férias

- **Criação (`POST /api/vacation-requests`):**
  - Aceita períodos múltiplos (até 3) ou único intervalo de datas.
  - Validações:
    - CLT: `validateCltPeriods` com aviso prévio, fracionamento, 14 dias, máximo 30 dias por ciclo.
    - Blackout: `checkBlackoutPeriods` por departamento.
    - Conflito com outras férias pendentes/aprovadas (`hasOverlappingRequest`).
    - Saldo de férias: `calculateVacationBalance` com `entitledDays`, `usedDays`, `pendingDays`, `availableDays`.
  - Se tudo ok, cria registros em transação (`prisma.$transaction`) e dispara notificação via webhook.

- **Edição de período (`POST /api/vacation-requests/[id]/update`):**
  - Restrito a **coordenadores/gestores, gerentes e RH** (colaborador não edita as próprias férias).
  - Verifica se o pedido é visível pela hierarquia (`hasTeamVisibility`).
  - Só permite alterações em status `PENDENTE`, com nova validação CLT + conflitos.

- **Cancelamento/Exclusão (`POST /api/vacation-requests/[id]/delete`):**
  - Colaborador cancela apenas enquanto o pedido não tiver aprovação final de RH.
  - Gestores/gerentes/RH podem excluir pedidos da equipe conforme regras de visibilidade.

### 3.2 Fluxo de aprovação

- Implementado em **`lib/vacationRules.ts`**:
  - `ROLE_LEVEL`, `ROLE_LABEL`, `getNextApprovalStatus`, `canApproveRequest`, `hasTeamVisibility`, `getApprovalSteps`, `getApprovalProgress`.
  - Fluxo padrão:
    - Funcionário → Coordenador → Gerente → RH.
    - Ninguém aprova a própria solicitação; sempre exige nível acima do solicitante.
- Rotas:
  - `POST /api/vacation-requests/[id]/approve` — avança status conforme `getNextApprovalStatus`, registra `history` e dispara notificação.
  - `POST /api/vacation-requests/[id]/reject` — marca como `REPROVADO`, guarda nota e histórico, notifica colaborador.

### 3.3 Dashboards por papel

- **Colaborador:**
  - Aba **Minhas Férias** com histórico, próximas férias em destaque e card de **Nova Solicitação** (com períodos e justificativa opcional).
- **Gestores/Coordenadores/Gerentes:**
  - Abas **Caixa de Aprovação** e **Histórico**, com filtros (busca, status, coordenador, departamento, período) e export CSV.
  - Visão **Times** mostrando colaboradores da equipe, saldo, status atual e linha do tempo de solicitações.
- **RH:**
  - Todas as visões anteriores + backoffice de usuários e relatórios de saldo.

---

## 4. Regras de negócio críticas

1. **CLT (São Paulo):**
   - Direito a 30 dias por ciclo de 12 meses; fracionamento em até 3 períodos, sendo um de 14+ dias.
   - Início não pode cair em sexta ou sábado; término não pode ser sábado ou domingo.
   - Feriados nacionais e municipais/estaduais de SP considerados (inclui datas móveis como Carnaval, Sexta-Feira Santa, Corpus Christi).
2. **Hierarquia e visibilidade:**
   - Coordenadores veem apenas seus reportes diretos; gerentes veem coordenadores + equipes; RH vê todos.
   - Regras centralizadas em `hasTeamVisibility` e reutilizadas em dashboard, times e APIs.
3. **Saldo de férias:**
   - `calculateVacationBalance` calcula dias adquiridos, usados, pendentes e disponíveis; valida se o colaborador já tem 12 meses de casa.
4. **Auditoria:**
   - Mudanças de status geram registros em `VacationRequestHistory` com `previousStatus`, `newStatus`, `changedByUserId`, `note` e `changedAt`.

---

## 5. Maturidade atual

- **Funcionalidade:** núcleo sólido para férias CLT com aprovação multi-nível.
- **Arquitetura:** boa separação em páginas, serviços e repositórios; algumas rotas ainda usam Prisma direto.
- **Testes:** Vitest + Stryker, alta cobertura em lib/services/repos; alguns cenários de workflow ainda geram falhas pontuais na suite.
- **Segurança:** sessão com cookie HTTP-only/HMAC; hash de senha ainda em SHA-256; rate limit já aplicado em login e criação de solicitações.
- **Observabilidade:** logging estruturado básico; health check implementado; ainda sem métricas ou tracing.

