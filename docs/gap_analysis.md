## Analise de gaps (CRITICAL/HIGH/MEDIUM/LOW)

Esta lista foca o que falta para o sistema ser operavel em ambiente corporativo real.

### RESOLVIDO (Itens endereçados recentemente)

1. **Consistência transacional e idempotência no consumo do período aquisitivo**
   - O consumo acontece dentro de uma `prisma.$transaction` e usa `updateMany` para garantir que o incremento de `usedDays` ocorra apenas uma vez.

2. **Segurança de Relatórios (CSV Formula Injection)**
   - Implementada a função `escapeCsvFormulas` em todos os relatórios exportados, protegendo contra execução de comandos via Excel (Padrão Sentinel).

3. **Troca de senha obrigatória**
   - Implementada a lógica de `mustChangePassword` para novos usuários, garantindo a integridade do acesso inicial.

---

### CRITICAL (bloqueia uso seguro em producao)

*(Nenhum item crítico pendente no momento)*

### HIGH

1. **Estado das rotas sem enforcement centralizado**
   - Ha checagens em `canApproveRequest`, mas a maquina de estados nao e centralizada num use case unico.

2. **Update de pedido pendente com enforcement limitado a cenarios com `hireDate`**
   - `POST /api/vacation-requests/[id]/update` passou a checar blackout e limite via `AcquisitionPeriod.usedDays`, mas o enforcement do periodo aquisitivo so acontece quando o `hireDate` do solicitante esta presente.
   - Impacto: em dados legados com `hireDate` ausente, pode haver bypass parcial.

3. **Solicitacoes que cruzam limites de periodo aquisitivo podem nao ser vinculadas**
   - `findAcquisitionPeriodForRange` exige que uma `AcquisitionPeriod` cubra integralmente o intervalo do pedido.
   - Impacto atual: para criacoes/updates recentes, esses casos sao bloqueados; ainda pode existir consistencia parcial em dados legados.

4. **CSV em risco de formula injection (Excel)**
   - Relatorios CSV inserem nomes/emails diretamente nas celulas sem sanitizacao contra valores iniciando com `=`, `+`, `-`, `@`.
   - Impacto: possivel execucao de formulas ao abrir CSV em software corporativo.
   - Evidencia: `app/api/reports/acquisition-periods/route.ts` e rotas de export CSV.

5. **CSRF e protecoes transversais insuficientes**
   - O sistema usa cookie de sessão e rotas POST sem token CSRF.
   - Em ambiente corporativo com autenticação por cookie, isso e um risco.

6. **Rate limit aplicado apenas a login/criacao**
   - Endpoints sensiveis como approve/reject/delete/update nao possuem rate limiting dedicado.

7. **Performance potencialmente limitada no Times/RH**
   - `findAllEmployees` inclui histories e recalcula saldo/ciclo para cada usuario em memoria.
   - Impacto: degradação com crescimento de volume.

8. **Regras CLT simplificadas (aderencia operacional parcial)**
   - A implementacao busca aderencia pratica, mas ainda tem suposicoes:
     - DSR e inicio/fim sao regras operacionais,
     - abono/13º sao informativos, sem validações juridicas completas,
     - limita saldo em ate 2 periodos (60 dias) e trata pedidos antigos de forma simplificada.

### MEDIUM
1. **Auditoria e trilhas de auditoria para mudanças sensiveis**
   - Historico grava transicoes de status, mas ajustes de datas e operacoes de exclusao/cancelamento nao sao modelados como eventos ricos (antes/depois).
2. **Validação baseada em schema nas rotas**
   - Parcialmente feito via validações manuais; recomendar schemas com Zod para contratos.
3. **Ausencia de testes E2E de rotas**
   - Unit tests sao fortes, mas nao substituem testes de contratos completos para regressao de status HTTP/DB.
4. **Observabilidade**
   - Logs existem (logger), mas faltam métricas/trace e um catalogo de eventos para auditoria operacional.

### LOW (melhorias incrementais)

1. Parametrizacao de feriados por unidade.
2. Acessibilidade automatizada.
3. Melhorias de UX em calendarios e visualizacao de conflito/sobreposicao.

