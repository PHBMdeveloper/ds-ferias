## Visao geral do sistema

Este projeto e um sistema interno de gestao de ferias CLT para um laboratorio/empresa (Editora Globo - Ferias). O objetivo e permitir:

- Colaborador: criar solicitacoes de ferias respeitando regras CLT e bloqueios internos.
- Gestores: aprovar/reprovar pela regra de lider direto.
- RH: visualizacao, relatorios, blackouts e auditoria (sem etapa de aprovacao).

---

## Arquitetura (alto nivel)

- `app/`: paginas e rotas HTTP (App Router).
- `components/`: UI por dominio (dashboard, requests, times, calendario, admin).
- `services/`: orquestracao e composicao de dados.
- `repositories/`: acesso a dados via Prisma.
- `lib/`: regras de negocio (dominio), auth, visibilidade, conflitos, utilitarios de datas.

---

## Papeis e fluxo de aprovacao (status)

- `PENDENTE` -> `APROVADO_GERENTE` (final)

Regra de permissao e definida em `lib/vacationRules.ts`:

- `ROLE_LEVEL` define hierarquia e habilita proximo status.
- `canApproveRequest` garante que apenas o lider direto (ou indireto sob condicao) pode aprovar.
- `getNextApprovalStatus` define o proximo status.

---

## Fluxo fim-a-fim (do pedido ao consumo do periodo aquisitivo)

1. Criacao do pedido:
   - Endpoint: `POST /api/vacation-requests`
   - Validacoes principais:
     - `validateCltPeriods` (CLT: fracionamento, aviso previo, DSR/feriados, etc.)
     - `checkBlackoutPeriods` (periodos bloqueados)
     - overlap com outros pedidos ativos do proprio colaborador
     - saldo via `calculateVacationBalance`
   - Regras de elegibilidade:
     - sem 12 meses de empresa nao ha direito.

2. Aprovacao:
   - Endpoint: `POST /api/vacation-requests/[id]/approve`
   - Revalida permissao (hierarquia) e visibilidade.
   - Calcula conflito de ferias no time via `detectTeamConflicts`.
   - Se houver conflito relevante, o frontend abre um modal de confirmacao; so entao a aprovacao e persistida.

3. Consumo do periodo aquisitivo (implementado):
   - O modelo de dados foi estendido para vincular cada `VacationRequest` a um `AcquisitionPeriod`.
   - Ao aprovar no status final (`APROVADO_GERENTE`), o backend:
     - identifica o `AcquisitionPeriod` que cobre o intervalo do pedido,
     - incrementa `AcquisitionPeriod.usedDays`,
     - preenche `VacationRequest.acquisitionPeriodId`.

Isso fornece rastreabilidade em banco para futuras regras e relatorios por periodo aquisitivo.

---

## Modelos principais (Prisma)

- `User`: hierarquia por `managerId`, papel (`Role`), relacionamento com `acquisitionPeriods`.
- `VacationRequest`: datas, status, flags (`abono`, `thirteenth`) e vinculo opcional com `acquisitionPeriodId`.
- `AcquisitionPeriod`: ciclos explicitamente persistidos de 12 meses e acumulador `usedDays`.
- `VacationRequestHistory`: auditoria de mudancas de status.
- `BlackoutPeriod`: bloqueios internos cadastrados pelo RH.

