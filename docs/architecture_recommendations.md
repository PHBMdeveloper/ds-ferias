# Architecture Recommendations — Editora Globo Férias

Sugestões para evolução arquitetural e escalabilidade futura.

---

## 1. Consolidar camada de domínio

- Introduzir uma pasta `domain/` com:
  - **Entidades** (VacationRequest, User, Team) definindo invariantes de negócio.
  - **Use cases** (CreateVacationRequest, ApproveVacationRequest, CancelVacationRequest, GenerateBalanceReport).
- A camada de aplicação (rotas Next.js) passa a orquestrar apenas:
  - autenticação/autorização;
  - parse/validação de entrada;
  - chamada de use cases;
  - montagem da resposta HTTP.

---

## 2. Modularização do módulo de regras

- Dividir `lib/vacationRules.ts` em submódulos:
  - `roles.ts` — hierarquia, labels, cores, helpers de aprovação.
  - `balance.ts` — cálculo de saldo, ciclos, entitlement.
  - `validation.ts` — validação de períodos CLT, aviso prévio, sobreposições.
  - `holidays.ts` — feriados fixos e móveis.
  - `teamVisibility.ts` — visibilidade de time, conflitos de equipe.
- Reexportar esses módulos de um `index.ts` para manter o ponto de entrada único.

---

## 3. Serviços orientados a cenários

- Manter serviços coesos por fluxo:
  - `DashboardService` — dados da home por papel.
  - `TimesService` — consolidação de times.
  - `ReportingService` — export, relatórios de saldo, relatórios de adesão.
- Evitar que serviços cresçam demais; extrair funções puras quando possível (fábricas de DTOs, mapeadores entre entidades e objetos de transporte).

---

## 4. Escalabilidade e resiliência

- **Rate limit distribuído:**
  - Mover o mecanismo atual para um backend como Redis; usar chaves por IP e userId.
- **Métricas e tracing:**
  - Integrar com solução de observabilidade (Prometheus + Grafana, Datadog, etc.) para acompanhar uso de rotas críticas.
- **Tolerância a falhas de notificações:**
  - Hoje os erros de webhook são ignorados silenciosamente; manter esse comportamento para não quebrar requests, mas adicionar logging estruturado e, idealmente, uma fila para reprocesso.

---

## 5. Multi-tenant / multi-filial (futuro)

Caso o sistema venha a ser reutilizado por mais unidades ou empresas:

- Introduzir um conceito de **tenant** (ex.: empresa/unidade) associado a usuários e solicitações.
- Isolar dados por tenant em queries (filtros obrigatórios) e, se necessário, em schemas de banco separados.

