# Engineering Review — Editora Globo Férias

Avaliação técnica do sistema atual, qualidade de código, arquitetura e dívidas remanescentes.

---

## 1. Arquitetura e separação de camadas

### 1.1 Pontos fortes

- **Camadas bem definidas:**
  - `repositories/` encapsulam todas as queries Prisma relevantes.
  - `services/` orquestram regras de negócio e compõem dados para o dashboard, times e export.
  - `app/` contém apenas lógica fina de autenticação/autorização, parsing de entrada e resposta HTTP.
  - `components/` divididos por domínio (dashboard, requests, layout, times).
- **Reuso de regras de visibilidade:**
  - `lib/requestVisibility.ts` e `lib/vacationRules.ts` centralizam “quem vê o quê” e o fluxo de aprovação.
  - `vacationRequestListService` unifica a listagem que abastece o **export** e pode ser reaproveitada em outras rotas.
- **Dashboard enxuto:**
  - `app/dashboard/page.tsx` apenas coordena searchParams, chama services e renderiza componentes.

### 1.2 Pontos de atenção

- Algumas rotas ainda usam Prisma direto em vez de repositórios (`app/admin/page.tsx`, `app/api/reports/balance/route.ts`).
- `lib/vacationRules.ts` continua sendo um módulo grande, embora bem estruturado; uma eventual divisão em submódulos (roles, balance, validation, holidays, team-visibility) facilitaria manutenção futura.

---

## 2. Qualidade de código e type safety

### 2.1 Pontos positivos

- Tipos de domínio claros (`VacationPeriod`, `VacationBalance`, tipos de dashboard e times).
- Rotas API usam tipos Prisma quando necessário (`VacationStatus`) e validam entrada, retornando sempre `{ error: string }` em respostas 4xx.
- Componentes React escritos em TypeScript com props tipadas, especialmente em `TimesView`, `RequestCard`, `ManagerView`, `FilterForm`.

### 2.2 Pontos de melhoria

- Ainda existem alguns `as any` em pontos específicos:
  - `calculateVacationBalance(userFull.hireDate, userFull.vacationRequests as any)` em `api/vacation-requests/route.ts` e `api/vacation-balance/route.ts`.
- Sugestão: criar um tipo leve para requests usados em cálculo de saldo, algo como:

```ts
type RequestForBalance = { startDate: Date; endDate: Date; status: string };
```

E utilizá-lo explicitamente nos casts e na definição de queries.

---

## 3. Regras de negócio e validações

### 3.1 Implementação atual

- `validateCltPeriods` cobre:
  - aviso prévio mínimo de 30 dias;
  - fracionamento em até 3 períodos, com um de pelo menos 14 dias;
  - mínimo de 5 dias por período;
  - respeito a DSR (início e término em dias úteis apropriados);
  - teto de 30 dias por ciclo.
- `checkBlackoutPeriods` impede marcação de férias em períodos bloqueados por departamento.
- `calculateVacationBalance` consolida dias usados, pendentes e disponíveis, considerando múltiplos ciclos.
- `canApproveRequest`, `getNextApprovalStatus`, `hasTeamVisibility` garantem que o fluxo de aprovação e visibilidade sigam a hierarquia.

### 3.2 Melhorias recentes

- Rota de **update** de férias agora:
  - bloqueia edição pelo colaborador; apenas coordenadores/gestores, gerentes e RH podem ajustar períodos alheios;
  - reaproveita `hasTeamVisibility` para garantir que o aprovador pertence à cadeia de gestão correta.
- Rota de **delete** diferencia cancelamento pelo colaborador (pré-RH) de exclusão administrativa pela gestão.
- Rate limit foi introduzido em login e criação de solicitações (`lib/rateLimit.ts`).

### 3.3 Riscos remanescentes

- Testes `validateCltPeriods` ainda apresentam casos de fronteira sensíveis a datas (início em sexta/sábado e término em fim de semana); a regra em si está correta, mas os testes exigem ajustes para cenários robustos a timezone.

---

## 4. APIs e contratos

### 4.1 Desenho atual

- Todas as rotas dependem de `getSessionUser` para autenticação; respondem 401 quando não autenticado.
- Autorização baseada em `ROLE_LEVEL` e `hasTeamVisibility`.
- Erros são retornados como JSON com `{ error: string }` e códigos HTTP apropriados (400, 401, 403, 404, 429).
- Export CSV (`/api/vacation-requests/export`) faz uso de `vacationRequestListService` para evitar divergência entre filtros da UI e do backend.

### 4.2 Melhorias possíveis

- Padronizar erros com um campo `code` (ex.: `"code": "INSUFFICIENT_BALANCE"`) para facilitar tratamento no front.
- Introduzir documentação de contratos (OpenAPI ou equivalente) ao menos para rotas de integração futuras.

---

## 5. Segurança e observabilidade

### 5.1 Segurança

- **Sessão:** cookie HTTP-only, opção de HMAC com `SESSION_SECRET`.
- **Senhas:** SHA-256 — **ponto crítico de dívida técnica**; recomendado migrar para bcrypt ou argon2 com estratégia de migração gradual (ver seção Next Steps).
- **Rate limit:** em memória para login e criação de solicitações; suficiente para ambiente interno, mas não ideal para múltiplas instâncias.

### 5.2 Observabilidade

- **Health check:** `/api/health` já implementado, verificando conectividade com DB.
- **Logging estruturado:** `lib/logger.ts` registra ações sensíveis (login, aprovação, reprovação, export) em JSON no stdout.
- **Métricas:** ainda inexistentes; recomendável adicionar contadores básicos (número de solicitações criadas/aprovadas/reprovadas, tempos de resposta) caso o sistema vá a produção com maior escala.

---

## 6. Manutenibilidade e complexidade

- O código é legível, com funções pequenas e nomes descritivos.
- Os serviços e repositórios reduzem acoplamento aos detalhes de Prisma.
- O principal ponto de complexidade é `lib/vacationRules.ts`, que concentra regras de negócio e cálculos; embora isso seja intencional, a divisão em submódulos poderá facilitar novas regras (ex.: políticas por departamento).

---

## 7. Dívida técnica priorizada

1. **Hash de senha:** migrar de SHA-256 para bcrypt/argon2 com migração segura.
2. **Rate limit em produção:** mover de in-memory para backend compartilhado (Redis ou similar) se houver multi-instância.
3. **Testes de integração de APIs:** cobrir fluxos completos de solicitação → aprovação → reprovação → cancelamento.
4. **Refino de testes de CLT:** alinhar testes com regras de datas (DSR e feriados), garantindo robustez ao fuso horário.
5. **Modularização de `vacationRules.ts`:** separar regras de hierarquia, saldo, validação de períodos e feriados.

