# Engineering Roadmap — Editora Globo Férias

## 1. HIGH IMPACT

### 1.1 Domínio e arquitetura
- **Descrição:** Modularizar `vacationRules` em submódulos (roles, balance, validation, holidays, visibility) e preparar camada `domain/` com use cases (Create/Approve/Reject/Cancel Vacation).
- **Complexidade:** Média/Alta.
- **Módulos afetados:** `lib/vacationRules`, `services/*`, `repositories/*`.
- **Benefício:** Melhora clareza do domínio, reduz acoplamento e facilita evolução de regras.

### 1.2 Índices de banco
- **Descrição:** Adicionar índices em `VacationRequest.userId`, `status`, `startDate`, `endDate` e em `User.managerId`.
- **Complexidade:** Baixa.
- **Módulos afetados:** `prisma/schema.prisma`, migrações.
- **Benefício:** Ganho direto de performance em dashboard, relatórios e visibilidade por gestor.

### 1.3 Validação de entrada com schemas
- **Descrição:** Introduzir validação com schema (ex.: Zod) em rotas críticas (login, criação/update de férias, admin CRUD).
- **Complexidade:** Média.
- **Módulos afetados:** `app/api/*`, `lib/validation`.
- **Benefício:** Segurança e confiabilidade maiores, mensagens de erro mais consistentes.

## 2. MEDIUM IMPACT

### 2.1 Paginação nas listagens
- **Descrição:** Implementar paginação/scroll infinito nas listagens de solicitações para gestores/RH.
- **Complexidade:** Média.
- **Módulos afetados:** `app/dashboard/page.tsx`, `services/dashboardDataService`, `vacationRequestListService`, componentes de lista.
- **Benefício:** Melhora responsividade em bases grandes.

### 2.2 Error boundaries por rota
- **Descrição:** Adicionar `error.tsx` para rotas chave (`dashboard`, `admin`) com mensagens amigáveis.
- **Complexidade:** Baixa/Média.
- **Módulos afetados:** `app/dashboard/`, `app/admin/`.
- **Benefício:** UX melhor em falhas inesperadas.

### 2.3 Observabilidade aprimorada
- **Descrição:** Expandir `logger` para métricas básicas (contagem de logins falhos, tempo de geração de relatórios) e integração futura com stack de observabilidade.
- **Complexidade:** Média.
- **Módulos afetados:** `lib/logger`, rotas API, serviços.
- **Benefício:** Facilita troubleshooting e capacity planning.

## 3. LOW IMPACT

### 3.1 Guia de contribuição e DX
- **Descrição:** Criar `CONTRIBUTING.md`, exemplos de testes e playbook de features para novos devs.
- **Complexidade:** Baixa.
- **Módulos afetados:** `README`, `docs/*`.
- **Benefício:** Onboarding mais rápido, contribuições mais consistentes.

### 3.2 Pequenas refatorações
- **Descrição:**
  - Extrair funções utilitárias pequenas repetidas em componentes.
  - Padronizar nomes de variáveis e props em componentes de requests.
- **Complexidade:** Baixa.
- **Módulos afetados:** `components/*`.
- **Benefício:** Código mais limpo e previsível.

