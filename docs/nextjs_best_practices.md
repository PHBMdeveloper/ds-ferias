# Next.js Best Practices Audit — Editora Globo Férias

## 1. Uso de Server/Client Components

- **Server Components predominantes:**
  - Páginas em `app/dashboard/page.tsx` e `app/admin/page.tsx` são server-side, fazendo data fetching no servidor.
- **Client Components onde faz sentido:**
  - Formulários interativos (`NewRequestCardClient`, `EditPeriodFormClient`, `ActionButtonForm`, `ThemeToggle`, `TimesViewClient`) usam `"use client"` e hooks de React.
- **Ponto de atenção:**
  - `ActionButtonForm` usa fetch client-side para ações simples de API; em fluxos futuros mais complexos, considerar `server actions` ou formulários `POST` nativos para reduzir lógica boilerplate no cliente.

## 2. Data fetching e rotas API

- **Padrão atual:**
  - Dashboard e Admin usam services + repositories dentro de server components (bom para SEO e performance).
  - Rotas API expõem endpoints para ações (aprovar/reprovar/cancelar/update) e relatórios (CSV).
- **Boas práticas aplicadas:**
  - Uso consistente de `getSessionUser()` para autenticação.
  - Erros estruturados com JSON e códigos HTTP corretos.
- **Oportunidades:**
  - Documentar melhor o uso dessas rotas (ver notas no README e docs de API futuros).

## 3. Organização de rotas e pastas

- Estrutura clara: `app/api/*` para APIs, `app/*/page.tsx` para páginas.
- `app/api/vacation-requests/[id]/...` agrupa ações relacionadas a uma mesma entidade (boa prática).

## 4. Caching e performance

- Atualmente não há uso explícito de `revalidate`, `cache`, ou `fetch` com opções de cache em rotas.
- Para este domínio (dados frequentemente mutáveis, dependentes de sessão de usuário), o uso de SSR sem cache agressivo é aceitável.
- Futuro: avaliar cache curto para dados raramente mutáveis (ex.: lista de gestores, departamentos) via `revalidate` ou camada de cache externa.

## 5. Loading states e UX

- **Login:** overlay de loading bloqueando a tela, com `role="status"` e `aria-live`.
- **Ações em cards:** `ActionButtonForm` exibe overlay global "Processando..." para evitar cliques múltiplos.
- **Dashboard:** não há páginas `loading.tsx` dedicadas, mas a renderização é relativamente rápida pela quantidade moderada de dados.

## 6. Error boundaries

- Não há `error.tsx` específicos por rota.
- Recomendável adicionar error boundaries ao menos para `dashboard` e `admin` para exibir mensagens amigáveis caso uma query falhe.

