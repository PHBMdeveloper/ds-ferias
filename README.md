## Portal de Férias (DS-Férias)

Aplicação interna para gestão de férias (colaborador, gestor e RH) construída em **Next.js 16**, **Prisma** e **Postgres**, com fluxo de aprovação em duas etapas (gestor → RH) e validações básicas da CLT.

### Usuários de teste

Todos os usuários abaixo usam a **mesma senha**:

- **Senha padrão**: `senha123`

#### Colaboradores

- **Colaborador 1**
  - E-mail: `colaborador1@empresa.com`
- **Colaborador 2**
  - E-mail: `colaborador2@empresa.com`

#### Gestores

- **Gestor Líder**
  - E-mail: `gestor@empresa.com`
- **Gestor Projeto**
  - E-mail: `gestor2@empresa.com`

#### RH

- **RH Master**
  - E-mail: `rh@empresa.com`
- **RH Operacional**
  - E-mail: `rh2@empresa.com`

> Observação: gestores e RH também podem criar solicitações de férias, mas **não podem aprovar/reprovar as próprias solicitações**. Sempre é necessário outro usuário para aprovar.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
