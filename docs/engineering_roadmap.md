## Roadmap de Engenharia (prioridades para producao)

### Alta prioridade

1. **Teste E2E de rotas (EM ANDAMENTO)**
   - Garantir status codes e validações reais no Prisma em fluxo completo.

2. **Consistencia transacional no consumo do periodo aquisitivo (CONCLUÍDO)**
   - Implementado via `prisma.$transaction` e `updateMany`.

3. **Validação de payloads com schema (PENDENTE)**
   - Introduzir Zod para criação e update de férias.

4. **Sanitização de Exportações CSV (CONCLUÍDO)**
   - Implementado Padrão Sentinel contra Formula Injection.

5. **Indicadores Estratégicos de Gestão (CONCLUÍDO)**
   - Painel de Analytics em tempo real na aba Times.

4. **Camada de use cases (minima) / maquina de estados**
   - Centralizar regras de transicao de status em um unico modulo.
   - Reduzir duplicacao e risco de desvio entre rotas.

### Media prioridade

1. **Auditoria completa**
   - Registrar eventos de:
     - alteracao manual de periodo,
     - ajuste de blackout,
     - exclusao por papel,
     - vinculacao a `AcquisitionPeriod`.

2. **Performance no dashboard e times**
   - Introduzir cache e reduzir N+1.
   - Paginar/limitar includes historicos quando o volume crescer.

3. **KPIs e relatorios gerenciais**
   - Painel dedicado para RH com percentuais, distribuicao e SLA.

### Baixa prioridade

1. Parametrizacao de feriados/DSR por unidade.
2. Acessibilidade automatizada e testes de UI.
3. Melhorias de UX em calendarios e visuais de conflito.

