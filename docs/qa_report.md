# QA Report — Editora Globo Férias

## 1. System Overview

Sistema interno de gestão de férias com fluxo de aprovação em cadeia (FUNCIONARIO/COLABORADOR → COORDENADOR/GERENTE → RH), implementado em Next.js 16 (App Router) com Prisma/PostgreSQL. A arquitetura segue o padrão de rotas finas em `app/` (páginas + APIs), serviços em `services/`, acesso a dados em `repositories/` e regras de negócio consolidadas em `lib/vacationRules.ts` e `lib/requestVisibility.ts`. Dashboards e componentes de UI (em `components/`) consomem dados via services, respeitando regras de visibilidade e papéis definidos no domínio.

## 2. Project Health

- **Dependências e config:** `package.json` está consistente com Next 16, React 19 e Prisma 7; scripts de build/test/stryker configurados. `next.config.ts` é simples e compatível.  
- **Prisma/schema:** `schema.prisma` modela `User`, `VacationRequest`, `VacationRequestHistory` e `BlackoutPeriod` de forma coerente com o domínio e com as docs; ainda faltam índices secundários sugeridos em `database_review.md`, o que é um risco de performance, não de correção.  
- **Estrutura:** Pastas bem organizadas (`app/`, `components/`, `services/`, `repositories/`, `lib/`, `tests/`, `docs/`); a separação entre services/repos/lib evita lógica de negócio em componentes.  
- **Riscos de runtime:**  
  - Regras de negócio críticas centralizadas em um único módulo grande (`lib/vacationRules.ts`), aumentando impacto de mudanças, mas sem incoerências aparentes.  
  - Rate limiting em memória (`lib/rateLimit.ts`) é suficiente em uma instância, mas pode degradar sob múltiplas instâncias (risco de inconsistência, não de crash).  
  - Dependência de datas atuais em algumas validações pode gerar comportamentos de borda em ambientes com timezone diferentes, embora testes de workflow já tenham sido ajustados para isso.

## 3. Test Coverage Analysis

- **Suite de testes:** Uso de Vitest com cobertura configurada; `tests/` cobre:  
  - `vacationRules.test.ts` — regras CLT e de negócio.  
  - `workflows.test.ts` — cadeia de aprovação, visibilidade, CLT + blackout + saldo.  
  - `dashboardDataService.test.ts`, `teamMembersService.test.ts`, `vacationRequestListService.test.ts` — serviços.  
  - `repositories.test.ts` — repositórios de dados.  
  - `auth.test.ts`, `logger.test.ts`, `rateLimit.test.ts`, `notifications.test.ts`, `utils.test.ts`, `dashboardFilters.test.ts`, `requestVisibility.test.ts`.  
- **Mutation testing:** Stryker configurado com limite mínimo de 85%; README já atualizado para refletir isso.  
- **Cobertura de fluxos críticos:**  
  - Criação de férias: testada indiretamente via `validateCltPeriods`, `checkBlackoutPeriods` e `calculateVacationBalance` em `workflows.test.ts`.  
  - Aprovação: cadeia de status e permissões de aprovação cobertas em `workflows.test.ts` (uso de `canApproveRequest`, `getNextApprovalStatus`, `getApprovalProgress`, `hasTeamVisibility`).  
  - Visibilidade: `requestVisibility.test.ts` e `workflows.test.ts` cobrem quem vê o quê por papel.  
  - Business rules: `vacationRules.test.ts` foca regras CLT e saldo.  
- **Gaps identificados:**  
  - Não há testes de nível API para as rotas `app/api/*` (login, criação de férias, approve/reject/delete/update, relatórios), apenas de domínio/serviços.  
  - Pouca ou nenhuma cobertura automatizada para componentes client críticos (`NewRequestCardClient`, `EditPeriodFormClient`, `TimesViewClient`) — testes atuais assumem que UI consome corretamente as regras.  

## 4. Workflow Validation

### 4.1 Colaborador (FUNCIONARIO/COLABORADOR)

- **Criar solicitação:** Implementado em `POST /api/vacation-requests`; aplica `validateCltPeriods`, `checkBlackoutPeriods`, cálculo de saldo (`calculateVacationBalance`), detecção de conflitos (`hasOverlappingRequest`) e rate limit. Fluxo parece correto, com mensagens de erro claras.  
- **Editar solicitação:** Bloqueado para colaborador pelas regras recentes; apenas coordenadores/gerentes/RH podem editar (`/api/vacation-requests/[id]/update`), coerente com o requisito atual.  
- **Cancelar solicitação:** `POST /api/vacation-requests/[id]/delete` permite ao dono apagar pedidos enquanto não houver aprovação final do RH; estados permitidos são `PENDENTE`, `APROVADO_GESTOR/COORDENADOR/GERENTE`. Comportamento consistente com docs e evita cancelamento tardio.  

### 4.2 Coordenador / Gerente

- **Ver solicitações da equipe:** Feito via dashboard (services + `requestVisibility` + `hasTeamVisibility`); coordenador vê apenas time direto; gerente vê diretos e indiretos conforme hierarquia (`managerId` e `manager.managerId`).  
- **Aprovar/Reprovar:**  
  - `POST /api/vacation-requests/[id]/approve` usa `canApproveRequest` + `ROLE_LEVEL` para garantir que só o nível adequado aprove cada status.  
  - Coordenador só aprova time direto; gerente aprova diretos e indiretos.  
  - Aprovação da própria solicitação é bloqueada por `canApproveRequest`.  
- **Excluir solicitações da equipe:** `/api/vacation-requests/[id]/delete` permite exclusão por coordenador/gerente dentro da sua cadeia de visibilidade, mas somente antes da aprovação final do RH; RH pode excluir qualquer pedido.  

### 4.3 RH

- **Gerenciar solicitações:** RH enxerga tudo (`hasTeamVisibility` retorna true para RH) e pode aprovar etapas finais (`APROVADO_GERENTE` → `APROVADO_RH`).  
- **Dashboards e relatórios:**  
  - Dashboard RH mostra saldo, times, blackouts e filtros.  
  - Relatórios `api/reports/balance` e `api/reports/adherence` expõem CSVs para saldo de férias e aderência (quem tem direito e não tirou férias).  
  - Export de solicitações (`api/vacation-requests/export`) reutiliza `vacationRequestListService`, o que reduz risco de divergência entre listagem e CSV.  

No geral, os workflows principais por papel estão coerentes com as docs e as regras de negócio; o maior risco está mais em casos de borda do que na lógica principal.

## 5. Business Rule Validation

- **Detecção de sobreposição:**  
  - Função local `hasOverlappingRequest` em `api/vacation-requests/route.ts` verifica overlap de períodos considerando apenas status ativos (`PENDENTE` + aprovados até RH).  
  - `detectTeamConflicts` em `vacationRules` detecta conflitos por equipe (usado em times/serviços).  
- **Duração mínima/máxima:**  
  - `validateCltPeriod` e `validateCltPeriods` garantem 5–30 dias por período, no máximo 3 períodos, pelo menos um com ≥ 14 dias no ciclo.  
- **Blackout:**  
  - `checkBlackoutPeriods` bloqueia solicitações sobrepondo períodos de blackout global/departamental; testado em `workflows.test.ts`.  
- **Saldo de férias:**  
  - `calculateVacationBalance` calcula `entitledDays`, `pendingDays`, `usedDays`, `availableDays` com base em `hireDate` e status das requests; trata casos sem hireDate como 30 dias de direito. Coberto em testes de balance.  
- **CLT / datas / feriados:**  
-  - Cálculos de dias e diffs agora usam datas normalizadas em UTC (`toUtcMidnight`, `daysBetweenInclusive`), reduzindo o risco de comportamento diferente por timezone.  
  - Validação de aviso prévio de 30 dias, início não em sexta/sábado e término não em sábado/domingo.  
  - Uso de feriados (São Paulo + nacionais) via `isSaoPauloHoliday`, que consulta primeiro um cache de feriados nacionais alimentado automaticamente pela BrasilAPI (`ensureNationalHolidaysLoaded`) e depois aplica a lista fixa + regras móveis como fallback.  

**Riscos e bordas identificados:**

- Dependência de timezone foi significativamente reduzida com a normalização em UTC, mas ainda é importante rodar testes em ambientes de staging com timezone diferente para garantir ausência de regressões.  
- `hasOverlappingRequest` está duplicado apenas na rota de criação; não há uma função reutilizável exposta no domínio (risco de divergência se lógica for expandida em outros pontos no futuro).  
- Cenários com múltiplos períodos, múltiplas solicitações em ciclos diferentes e alterações manuais pelo RH são complexos, embora a lógica atual pareça consistente com as regras descritas.

## 6. Security & Permission Checks

- **Autenticação:**  
  - `POST /api/login` usa `verifyCredentials` + `createSession`, com cookie HTTP-only e assinatura HMAC opcional; rate limit por IP via `checkRateLimit`.  
- **Autorização:**  
  - Uso consistente de `getSessionUser()` em rotas API sensíveis.  
  - `ROLE_LEVEL` e `hasTeamVisibility` centralizam regras de permissão.  
  - Colaborador não pode editar a própria solicitação de férias; apenas coordenador/gerente/RH com visibilidade adequada pode usar `update`.  
  - Aprovação própria é bloqueada (`canApproveRequest` compara `userId`).  
- **Input validation:**  
  - Validação básica de tipos (`typeof` checks), CUID (`isCuid/requireCuid`), e lógica de datas nas rotas de férias.  
  - Ainda não há validação baseada em schema (Zod ou similar) para os principais payloads; isso deixa espaço para payloads parcialmente válidos ou erros de mensagem inconsistentes entre rotas.  

**Riscos de segurança:**

- Falta de schemas formais de validação para `login`, `vacation-requests` (POST/UPDATE) e `admin` PATCH aumenta a chance de bugs sutis com payloads malformados.  
- O uso de SHA-256 para senhas é inferior a bcrypt/argon2 para produção (risco conhecido, já documentado nas docs).  

## 7. Edge Case Analysis

Casos analisados logicamente com base em código e testes:

- **Períodos sobrepostos na mesma solicitação:** Bloqueados por `validateCltPeriods` e por checks de overlap na criação.  
- **Datas inválidas (start > end ou NaN):** Verificadas tanto em `validateCltPeriods` quanto nas rotas (checam `isNaN` e `end < start`).  
- **Múltiplas solicitações no mesmo ciclo:** `existingDaysInCycle` + `entitledDays` asseguram que o total do ciclo não ultrapasse o direito; teste em `vacationRules.test.ts` e `workflows.test.ts`.  
- **Solicitações em blackout:** Bloqueadas por `checkBlackoutPeriods`; edge case sem overlap é testado.  
- **Corrida de estados (race conditions):**  
  - Não há locks explícitos; duas aprovações simultâneas poderiam, em teoria, aplicar o mesmo `previousStatus`, mas a cadeia de estados é linear e terminada (`APROVADO_RH` final), o que reduz impacto (última gravação vence).  
  - Cancelamento/cancelar vs. aprovar em paralelo não está protegido por transações exclusivas, mas estados válidos são checados antes de ações sensíveis.  
- **Datas em virada de ano:** `calculateVacationBalance` e `calcUsedDays` usam `getFullYear` do `startDate` para contar dias por ano, o que trata corretamente férias que cruzam ano civil, mas a lógica de ciclos (12 meses trabalhados) pode ficar difícil de explicar em cenários complexos (embora consistente).  

## 8. Risks and Findings

- **R1 — Falta de testes de API end-to-end:** Toda a validação depende de testes de domínio/serviços; mudanças em rotas podem introduzir regressões não cobertas por testes.  
- **R2 — Validação de entrada limitada:** Ausência de schemas formais deixa margem para inconsistência entre rotas e mensagens de erro, especialmente em `login`, `vacation-requests` POST/UPDATE e `admin` PATCH.  
- **R3 — Módulo de domínio grande (`vacationRules.ts`):** Qualquer alteração nesse arquivo tem impacto amplo; risco de regressão se futuras mudanças não forem bem testadas.  
- **R4 — Timezone e feriados (mitigado em parte):** Lógica de datas foi migrada para UTC e feriados nacionais passaram a ser carregados automaticamente via API externa com cache, mas ainda é necessário monitorar ambientes com timezone distintos e garantir fallback adequado caso a API fique indisponível.  
- **R5 — Performance de queries sem índices secundários:** `schema.prisma` não inclui índices explícitos para colunas de alto uso (`VacationRequest.userId/status/startDate/endDate`, `User.managerId`); risco de lentidão em ambientes com grande volume de dados, afetando dashboards e relatórios.  
- **R6 — Autenticação com SHA-256:** Do ponto de vista de segurança real, o hash de senha é mais fraco que o ideal (bcrypt/argon2).  

## 9. Recommended Improvements

Backlog priorizado a partir dos riscos e achados acima.

### 9.1 Alta prioridade

1. **[QA] Testes de API end-to-end para fluxos críticos**  
   - Criar suite em `tests/api/` cobrindo:  
     - login/logout;  
     - criação de férias (`POST /api/vacation-requests`), incluindo erros de CLT, blackout, saldo insuficiente e overlap;  
     - aprovação/reprovação/cancelamento (`/api/vacation-requests/[id]/approve|reject|delete|update`);  
     - relatórios e export CSV (`/api/reports/balance`, `/api/reports/adherence`, `/api/vacation-requests/export`).  
   - Focar em contratos HTTP (status code, shape de resposta, mensagens de erro) e integração entre domínio e rotas.

2. **[Segurança] Validação de entrada baseada em schema nas rotas críticas**  
   - Adotar Zod (ou similar) em `lib/validation.ts` e reutilizar nas rotas:  
     - `POST /api/login`;  
     - `POST /api/vacation-requests`;  
     - `POST /api/vacation-requests/[id]/update`;  
     - `PATCH /api/users/[id]` (admin/RH).  
   - Padronizar mensagens de erro e tipos esperados; remover validação manual dispersa.

3. **[DB/Performance] Adicionar índices Prisma para colunas de alto uso**  
   - Implementar `@@index([userId])`, `@@index([status])`, `@@index([startDate])`, `@@index([endDate])` em `VacationRequest` e `@@index([managerId])` em `User` conforme `database_review.md`.  
   - Rodar migrações e validar impacto em dashboards e relatórios.

### 9.2 Média prioridade

4. **[Domínio] Isolar lógica de overlap em módulo reutilizável**  
   - Extrair `hasOverlappingRequest` de `api/vacation-requests/route.ts` para um helper de domínio/serviço reutilizável.  
   - Usar essa função tanto na criação quanto em qualquer futuro update que precise checar conflitos.

5. **[QA] Fortalecer testes de borda de datas**  
   - Ampliar `vacationRules.test.ts` e `workflows.test.ts` com:  
     - períodos cruzando ano civil;  
     - datas próximas a feriados e DSR;  
     - múltiplas solicitações no mesmo ciclo com diferentes combinações de status;  
     - cenários de alteração/cancelamento próximo à data de início.

6. **[Segurança] Planejar migração de hash de senha para bcrypt/argon2**  
   - Implementar `hashPassword/verifyPassword` com biblioteca adequada.  
   - Estratégia de migração: aceitar SHA-256 legado, re-hash em bcrypt/argon2 em login bem-sucedido e, após período de transição, remover suporte ao formato antigo.

### 9.3 Baixa prioridade

7. **[QA/UI] Testes de UI para componentes client críticos**  
   - Adicionar testes de comportamento (ex.: com Testing Library) para:  
     - `NewRequestCardClient` (validação de períodos, exibição de erros do backend);  
     - `EditPeriodFormClient` (envio de update, manejo de erros de CLT/overlap);  
     - `TimesViewClient` (expansão/retração de times, acessibilidade básica).  
   - Objetivo: garantir que a UI propaga corretamente os estados e mensagens das APIs.

