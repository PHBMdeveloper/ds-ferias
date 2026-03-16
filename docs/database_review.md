# Database & Prisma Review — Editora Globo Férias

## 1. Modelagem atual (`schema.prisma`)

- **Entidades principais:**
  - `User` com `role`, `department`, `hireDate`, hierarquia (`managerId`, `reports`).
  - `VacationRequest` com intervalo de datas, status, notas por papel e `history` associado.
  - `VacationRequestHistory` para trilha de auditoria.
  - `BlackoutPeriod` para períodos de bloqueio.

A modelagem é consistente com o domínio de férias e suporta bem o fluxo de aprovação multi-nível.

## 2. Relações

- `User` ↔ `VacationRequest` (1:N) e `User` ↔ `User` (hierarquia de gestor).
- `VacationRequest` ↔ `VacationRequestHistory` (1:N, `onDelete: Cascade`).
- `BlackoutPeriod` guarda o `createdBy` (User) para auditoria.

## 3. Índices e chaves

- `User.email` é `@unique` (bom para login).
- Faltam índices explícitos em colunas de filtro pesado:
  - `VacationRequest.userId` (já é FK, geralmente indexado pelo provedor, mas convém garantir).
  - `VacationRequest.status`, `VacationRequest.startDate`, `VacationRequest.endDate` para queries por período/estado.
  - `User.managerId` para visibilidade por gestor.

## 4. Recomendações

1. **Adicionar índices secundários** (alto impacto, baixa complexidade)

   ```prisma
   model VacationRequest {
     id        String   @id @default(cuid())
     userId    String
     status    VacationStatus @default(PENDENTE)
     startDate DateTime
     endDate   DateTime

     @@index([userId])
     @@index([status])
     @@index([startDate])
     @@index([endDate])
   }

   model User {
     id        String @id @default(cuid())
     managerId String?

     @@index([managerId])
   }
   ```

2. **Revisar limites de texto**
   - Notas (`notes`, `managerNote`, `hrNote`, `VacationRequestHistory.note`) usam `Text`; isso é adequado para comentários maiores.

3. **Migrações e seeds**
   - `prisma/seed.ts` define dados iniciais; é importante alinhar o seed com a hierarquia/documentação de roles.

4. **Monitoração de queries lentas**
   - Ativar logs de `prisma` (query/time) em ambientes de staging para identificar consultas com scan completo.

