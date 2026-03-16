# Performance Audit — Editora Globo Férias

## 1. Perfil de carga esperado

- Sistema interno, número moderado de usuários simultâneos.
- Maiores riscos de carga: períodos de fechamento de férias, campanhas internas, fim de ano.

## 2. Riscos de performance identificados

1. **Dashboard único com múltiplos blocos de dados**
   - `app/dashboard/page.tsx` monta um layout relativamente grande com cards, filtros, times e lista de solicitações.
   - Para alguns usuários (RH/gestores com muitas equipes), o volume de dados pode crescer.

2. **Filtros em memória em alguns pontos**
   - A maior parte da filtragem já está em `buildManagedRequestsWhere` (Prisma) + `filterRequestsByVisibilityAndView` (JS).
   - Em volumes muito altos de `VacationRequest`, o filtro em memória pode pesar.

3. **Relatórios CSV**
   - Export de férias e relatórios de aderência/balance utilizam `findMany` + processamento em memória.
   - Para bases muito grandes, pode ser necessário paginação/streaming.

## 3. Pontos fortes

- **Serviços reutilizáveis para listagem:** `vacationRequestListService` evita duplicação de lógica de filtragem e reduz risco de N+1.
- **Queries Prisma com `select/include` enxutos:** as queries focam apenas nos campos necessários (especialmente nos repositories).
- **Validação CLT e cálculo de saldo no servidor:** regras mais pesadas rodam no backend, não no cliente.

## 4. Recomendações de melhoria

1. **Paginação explícita em listagens** (médio impacto, média complexidade)
   - Implementar `limit/offset` ou cursor na listagem de solicitações, especialmente para gestores/RH.
   - Reduz o volume de dados carregados numa única requisição.

2. **Índices de banco (ver `database_review.md`)** (alto impacto, baixa complexidade)
   - Garantir índices em colunas frequentemente filtradas (`userId`, `status`, `startDate`, `endDate`, `managerId`).

3. **Stream de CSV para grandes relatórios** (médio impacto, alta complexidade)
   - Em cenários de muitos milhares de registros, usar streaming de resposta ou jobs assíncronos em vez de gerar tudo em memória.

4. **Monitorar queries com logs estruturados** (médio impacto, baixa complexidade)
   - O logger atual pode ser estendido para logar tempo de execução de trechos críticos (ex.: carregamento de dashboard, relatórios).

