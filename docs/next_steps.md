# Next Steps — Editora Globo Férias

Roadmap priorizado de evolução técnica e de produto.

---

## 1. Curto prazo (1–2 sprints)

### 1.1 Segurança e robustez

1. **Migrar hash de senha para bcrypt/argon2**
   - Introduzir funções `hashPassword`/`verifyPassword` com biblioteca adequada.
   - Estratégia incremental: aceitar SHA-256 legado e re-hash em bcrypt na próxima autenticação bem-sucedida.
2. **Refinar rate limiting**
   - Mover o controle em memória (`lib/rateLimit.ts`) para um backend compartilhado (Redis) se houver múltiplas instâncias.
3. **Testes de integração de APIs**
   - Criar suíte em `tests/api/` cobrindo criação, aprovação, reprovação, cancelamento e export.

### 1.2 Arquitetura

1. **Aproximação total das rotas a serviços/repos**
   - Refatorar `app/admin/page.tsx` e `app/api/reports/balance/route.ts` para usar `userRepository` e, se necessário, um `reportService`.
2. **Remoção de `any` residual**
   - Trocar casts envolvendo `vacationRequests as any` por tipos explícitos usados em `calculateVacationBalance`.

---

## 2. Médio prazo (3–6 sprints)

### 2.1 Funcionalidades de produto

1. **Calendário visual de férias**
   - Módulo de calendário em `components/calendar/` alimentado por um service que consolida períodos por colaborador.
2. **Notificações por e-mail**
   - Usar Resend/SMTP para enviar e-mails transacionais em criação, aprovação, reprovação e cancelamento.
3. **Relatórios de adesão**
   - Nova rota em `app/api/reports/adherence` detalhando quem não tirou férias no período.

### 2.2 Observabilidade

1. **Logging estruturado avançado**
   - Expandir `logger` com contexto de request (correlation id, rota, userId).
2. **Métricas básicas**
   - Exportar métricas (contadores de solicitações, aprovações, reprovações, tempos de resposta) para um backend de métricas.

---

## 3. Longo prazo

### 3.1 Evolução arquitetural

1. **Modularizar `vacationRules.ts`**
   - Separar em submódulos (`roles.ts`, `balance.ts`, `validation.ts`, `holidays.ts`, `teamVisibility.ts`).
2. **Camada de domínio explicitada**
   - Definir uma pasta `domain/` com agregados (VacationRequest, User, Team) e use cases, reduzindo dependência direta de Prisma nos serviços.

### 3.2 Extensões de produto

1. **Políticas por departamento**
   - Permitir configurações de aviso prévio, fracionamento ou restrições adicionais por departamento além da CLT base.
2. **Delegação de aprovação e substituição automática**
   - Modelo de delegação com vigência (ex.: período em que um outro gestor assume aprovações).
3. **Integração com sistemas corporativos**
   - Export/Sync com sistemas de folha de pagamento e RH.

