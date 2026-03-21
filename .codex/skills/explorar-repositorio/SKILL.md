---
name: explorar-repositorio
description: Explorar rapidamente este repositório de gestão de férias, mapear arquitetura, rotas, serviços, regras de negócio, comandos úteis e áreas de risco. Use quando precisar entender a base antes de alterar código, investigar bugs, localizar responsabilidades entre camadas ou produzir um resumo técnico do projeto.
---

# explorar-repositorio

Faça uma exploração orientada do repositório e entregue um resumo acionável para outra instância do Codex.

## Fluxo recomendado

1. Ler `README.md` para captar objetivo do produto, stack, scripts e visão geral.
2. Mapear a estrutura por camadas com foco em `app/`, `components/`, `lib/`, `repositories/`, `services/`, `prisma/`, `tests/` e `docs/`.
3. Identificar os pontos de entrada mais relevantes:
   - rotas do App Router em `app/`
   - regras de negócio em `lib/`
   - orquestração em `services/`
   - acesso a dados em `repositories/`
   - modelo de dados em `prisma/schema.prisma`
4. Conferir os testes existentes para descobrir o comportamento já protegido por suíte automatizada.
5. Produzir um resumo curto com:
   - objetivo do sistema
   - arquitetura em camadas
   - fluxos principais
   - arquivos-chave para a tarefa atual
   - riscos, lacunas ou dependências externas

## Heurísticas de exploração

- Preferir `rg`, `find` com `maxdepth` e leituras pontuais; evitar varreduras pesadas.
- Priorizar documentação já existente em `README.md` e `docs/` antes de inferir comportamento.
- Cruzar claims da documentação com código real em `app/`, `services/`, `repositories/` e `lib/`.
- Se a tarefa mencionar férias, aprovação, saldo, blackout ou visibilidade, revisar também `lib/vacationRules.ts`, `lib/requestVisibility.ts` e os serviços relacionados.
- Se a tarefa mencionar UI, começar por `app/page.tsx`, `app/dashboard/` e `components/`.
- Se a tarefa mencionar dados, abrir `prisma/schema.prisma` e correlacionar com `repositories/`.

## Entregável esperado

Responder com uma visão prática, não apenas uma lista de arquivos. Sempre que possível:

- apontar onde começar uma modificação;
- citar quais testes cobrem a área;
- destacar dependências externas relevantes;
- separar fatos confirmados de inferências.

## Recurso adicional

Se precisar de um mapa inicial do projeto e de perguntas-guia, ler `references/repo-map.md`.
