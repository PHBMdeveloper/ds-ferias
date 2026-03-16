# Developer Experience — Editora Globo Férias

## 1. Estrutura do projeto

- Estrutura organizada por camadas: `app/`, `components/`, `services/`, `repositories/`, `lib/`, `prisma/`, `tests/`, `docs/`.
- Nomeação de arquivos é consistente e descritiva (`*Service`, `*Repository`, `*Client`).
- Documentação consolidada em `project_overview`, `engineering_review`, `architecture`, `product_notes`, `next_steps`.

## 2. Onboarding de novos devs

- README descreve stack, scripts e metas de teste/mutação.
- Documentos de arquitetura e produto ajudam a entender rapidamente o domínio.
- Faltam ainda exemplos concretos em docs de:
  - Fluxo completo de criação/aprovação/cancelamento (sequência de chamadas e telas).
  - Contratos resumidos das principais rotas API.

## 3. Consistência de padrões

- Services/repositories seguem padrão consistente de naming.
- Uso uniforme de `getSessionUser`, `getRoleLevel` e `hasTeamVisibility` para permissões.
- UI padronizada com Tailwind + shadcn/ui.

## 4. Sugestões de melhoria

1. **Guia de contribuição** (médio impacto, baixa complexidade)
   - Criar `CONTRIBUTING.md` com orientações de dev: convenções de commit, estilo de código, como rodar testes/stryker, como criar migrations.

2. **Playbook de features** (médio impacto, média complexidade)
   - Em `docs/product_notes.md` ou novo doc, adicionar "Fluxos de uso" (ex.: "Como o RH verifica aderência", "Como o gestor usa a aba Times").

3. **Exemplos de testes** (médio impacto, baixa complexidade)
   - Incluir no README/`testing_strategy` exemplos pequenos para criar novos testes de domínio/serviços.

