# Product Notes — Editora Globo Férias

Resumo dos pontos principais de UX/produto para colaboradores, gestores e RH.

---

## 1. Experiência do colaborador

### Pontos fortes

- Fluxo de criação de solicitação simples, com até 3 períodos e feedback em tempo real sobre regras CLT (alertas de total de dias, períodos de 14+ dias, saldo no ciclo).
- Histórico de solicitações claro, com card por solicitação, status visível, observações e justificativa opcional.
- Seção **“Próximas férias”** e calendário mensal na aba Minhas Férias, destacando períodos pendentes/aprovados e quanto tempo falta.

### Oportunidades

- Notificações proativas (e-mail/Slack) para início de férias, aprovações e reprovações.

---

## 2. Experiência do coordenador/gerente

### Pontos fortes

- Aba **Caixa de Aprovação** com filtros (status, coordenador, departamento, período).
- Ações claras (Aprovar, Reprovar, Cancelar/Excluir) com toasts específicos e loading global.
- Aba **Times** com visão consolidada: quem está em férias, quem ainda tem saldo, e histórico resumido por colaborador.

### Oportunidades

- Visão agregada de **capacidade da equipe** (heatmap mensal de pessoas em férias por dia).
- Ações em lote (aprovar/reprovar múltiplas solicitações) com confirmação forte.
- Delegação temporária de aprovação quando o gestor está ausente.

---

## 3. Experiência do RH

### Pontos fortes

- Relatório de saldo (`/api/reports/balance`) e relatório de adesão (`/api/reports/adherence`) para identificar quem não tirou férias.
- Export CSV de solicitações e saldo atendendo cenários básicos de auditoria.
- Aba **Times** para visão global por gerente/coordenador.
- Backoffice (`/admin`) para gerenciar usuários, papéis, departamentos, gestores e admissões.

### Oportunidades

- Relatórios gerenciais mais avançados (concentração por mês/departamento, comparativos entre equipes).
- Auditoria explícita de ações administrativas (quem exportou, quem alterou dados sensíveis).

---

## 4. Acessibilidade e mobile

- Layout responsivo, com sidebar adaptada e alvos de toque ≥ 44px em formulários e botões principais.
- Skip link “Pular para o conteúdo principal” e foco visível em elementos interativos chave.
- Uso de `aria-label` e `role` em login, filtros, botões de times e ações sensíveis.

---

## 5. Próximas melhorias de produto (resumo)

- Calendário visual mais rico para gestores (equipe inteira) e visão de capacidade.
- Notificações por e-mail/Slack em eventos-chave.
- Delegação temporária e ações em lote.

Para detalhes, ver `docs/next_steps.md`.

