# Mapa inicial do repositório ds-ferias

## Propósito

Aplicação interna de gestão de férias com fluxo de aprovação, regras CLT, períodos aquisitivos, blackout e relatórios.

## Stack principal

- Next.js 16 com App Router
- React 19
- Prisma 7 + PostgreSQL
- Tailwind CSS 4
- Vitest + Stryker

## Mapa por áreas

### `app/`
Rotas, páginas e handlers de API. Começar aqui para localizar fluxos visíveis ao usuário e endpoints.

### `components/`
Componentes de UI por domínio, incluindo dashboard, requests, times e elementos reutilizáveis.

### `lib/`
Funções utilitárias e regras centrais de negócio, com destaque para autenticação, validação, regras de férias, visibilidade e integrações externas.

### `services/`
Orquestra casos de uso agregando regras de negócio e repositórios.

### `repositories/`
Camada de acesso a dados baseada em Prisma.

### `prisma/`
Schema, configuração e seed. Abrir `schema.prisma` para entender entidades e relações.

### `tests/`
Suíte Vitest cobrindo regras de negócio, serviços, repositórios e alguns componentes.

### `docs/`
Arquitetura, visão do sistema, roadmap, QA e análise de gaps.

## Arquivos-chave para primeiras leituras

1. `README.md`
2. `docs/system_overview.md`
3. `prisma/schema.prisma`
4. `lib/vacationRules.ts`
5. `services/dashboardDataService.ts`
6. `repositories/vacationRepository.ts`
7. `tests/workflows.test.ts`

## Perguntas-guia

- Onde a regra de negócio mora de verdade: em `lib/`, `services/` ou `repositories/`?
- Qual rota ou endpoint dispara o fluxo que preciso alterar?
- Quais entidades do Prisma participam do fluxo?
- Quais testes existentes falhariam se eu quebrasse esse comportamento?
- Existe documentação em `docs/` que contradiz ou complementa o código atual?
