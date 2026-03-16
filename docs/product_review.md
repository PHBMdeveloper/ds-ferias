# Product Review — Editora Globo Férias

Avaliação do sistema sob a perspectiva de produto/UX para colaboradores, gestores e RH.

---

## 1. Experiência do colaborador

### 1.1 Pontos fortes

- Fluxo de criação de solicitação simples, com até 3 períodos e feedback em tempo real sobre regras CLT (alertas de total de dias, períodos de 14+ dias, saldo no ciclo).
- Histórico de solicitações claro, com card por solicitação, status visível e observações.
- Seção **“Próximas férias”** na aba Minhas Férias, destacando as férias que se aproximam (pendentes ou aprovadas) com indicação de quanto tempo falta.
- Campo de **Justificativa (opcional)** destacado no formulário de nova solicitação, ajudando na comunicação com gestor e RH.

### 1.2 Pontos a melhorar

- Não existe ainda um **calendário visual mensal** agregando todas as férias do colaborador; hoje ele vê apenas lista + resumo de próximas férias.
- Não há lembretes proativos via canal externo (e-mail, Slack, etc.) sobre início de férias, aprovações ou reprovações — tudo acontece dentro do sistema.

---

## 2. Experiência do coordenador/gerente

### 2.1 Pontos fortes

- Aba **Caixa de Aprovação** mostra as solicitações pendentes com filtros de status, coordenador, departamento e período.
- Actions claras em cada card (Aprovar, Reprovar, Cancelar/Excluir) com toasts específicos e loading global para evitar ações duplicadas.
- Aba **Times** oferece visão por colaborador com:
  - status se está em férias agora;
  - quantos dias ainda tem para tirar;
  - histórico resumido de solicitações por colaborador.

### 2.2 Pontos a melhorar

- Falta uma visão agregada de **capacidade da equipe ao longo do tempo** (ex.: heatmap mensal com quantidade de pessoas em férias).
- Ações em lote (aprovar/reprovar múltiplas solicitações) ainda não existem; poderiam agilizar o trabalho em períodos de pico.
- Delegação temporária de aprovação (quando o gestor está de férias ou afastado) ainda não está suportada.

---

## 3. Experiência do RH

### 3.1 Pontos fortes

- Relatório de saldo (`/api/reports/balance`) e export CSV de solicitações atendem a cenários básicos de auditoria.
- Aba **Times**, na visão de RH, permite enxergar times agrupados por gerente e coordenador, com saldo por colaborador.
- Backoffice (`/admin`) possibilita gerenciar usuários, papéis, departamentos, gestores e datas de admissão.

### 3.2 Pontos a melhorar

- Relatórios gerenciais mais avançados:
  - quem não tirou férias em determinado período (adesão);
  - concentração de férias por mês/departamento;
  - comparativos entre equipes.
- Auditoria explícita de ações administrativas (ex.: quem exportou relatórios, quem alterou saldos manualmente, se houver esse fluxo).

---

## 4. Acessibilidade e mobile

- Layout responsivo com sidebar adaptada, alvos de toque ≥ 44px em formulários e botões principais.
- Skip link “Pular para o conteúdo principal” e foco visível em botões e links importantes.
- Aria labels e roles adicionados em login, filtros, botões de times e ações sensíveis.
- Recomendação: testes consistentes em dispositivos reais (iOS/Android) e revisão mais profunda de contraste e navegação por teclado.

---

## 5. Principais oportunidades de evolução de produto

1. **Calendário visual consolidado (colaborador e gestão):**
   - Visão mensal com blocos de férias por colaborador; para gestores, agregando a equipe.
2. **Notificações por e-mail e/ou Slack/Teams:**
   - Confirmação de solicitação criada, aprovação e reprovação; lembretes de início de férias.
3. **Relatórios de adesão e conformidade:**
   - Identificar quem não tirou férias em X meses ou que está próximo de “estourar” o limite legal.
4. **Delegação temporária:**
   - Permitir que um gestor delegue aprovação a outro durante suas próprias férias.
5. **Ações em lote:**
   - Aprovar/Reprovar múltiplos pedidos com confirmação reforçada.

