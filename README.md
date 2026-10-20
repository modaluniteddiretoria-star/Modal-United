# Modal United

Site da Modal United, consultoria imobiliária em São Paulo: vitrine de imóveis,
agendamento de visitas e painel administrativo para editar perfil e imóveis.

Stack: React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha ADMIN_PASSWORD (mínimo 12 caracteres)
```

Em dois terminais:

```bash
npm run server   # API em http://localhost:3001 (lê ADMIN_PASSWORD do ambiente)
npm run dev      # site em http://localhost:5173, com /api encaminhado para a API
```

No PowerShell, defina a senha antes de iniciar a API: `$env:ADMIN_PASSWORD="sua-senha-forte"`.

## Scripts

| Comando           | O que faz                             |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (Vite)    |
| `npm run server`  | API local (`server.js`)               |
| `npm run build`   | Checagem de tipos + build de produção |
| `npm run lint`    | ESLint                                |
| `npm run preview` | Serve o build de produção             |

## Estado atual e próximos passos

- A API em `server.js` grava os dados em `data/site-config.json`. Isso funciona
  localmente, mas **não na Vercel** (sistema de arquivos efêmero).
- Os agendamentos ficam apenas no `localStorage` do visitante.
- Próxima fase: migrar autenticação, dados do site, imagens e agendamentos para o
  Supabase (Auth + Postgres com RLS + Storage) e publicar na Vercel.
