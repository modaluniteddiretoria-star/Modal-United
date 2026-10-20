# Modal United

Site da Modal United, consultoria imobiliária em São Paulo: vitrine de imóveis,
agendamento de visitas e painel administrativo para editar perfil, imóveis e ver
os agendamentos.

Stack: React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion e Supabase
(Postgres com RLS, Auth e Storage). Hospedagem na Vercel.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a chave publishable do Supabase
npm run dev                  # http://localhost:5173
```

## Scripts

| Comando           | O que faz                             |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (Vite)    |
| `npm run build`   | Checagem de tipos + build de produção |
| `npm run lint`    | ESLint                                |
| `npm run preview` | Serve o build de produção             |

## Banco de dados (Supabase)

O esquema está em [`supabase/migrations`](supabase/migrations) e os dados iniciais em
[`supabase/seed.sql`](supabase/seed.sql).

| Tabela          | Público                         | Admin                 |
| --------------- | ------------------------------- | --------------------- |
| `agent_profile` | lê                              | edita                 |
| `properties`    | lê                              | cria, edita e remove  |
| `bookings`      | sem acesso direto (usa as RPCs) | lê e cancela          |
| `admins`        | sem acesso                      | gerenciado no painel do Supabase |

Os visitantes agendam pela Edge Function `create-booking`
([`supabase/functions`](supabase/functions)), que valida o captcha invisível do
Cloudflare Turnstile e então chama `create_booking` com o service role (o RPC não
é executável por `anon`). Horários ocupados e cancelamento usam `get_taken_slots`
e `cancel_booking`. Todas validam data, horário, telefone e conflitos no servidor.

Variáveis: `VITE_TURNSTILE_SITE_KEY` (pública, na Vercel e no `.env.local`) e o
secret `TURNSTILE_SECRET_KEY` da Edge Function (só no painel do Supabase).
As imagens enviadas pelo painel vão para o bucket público `site-images`, onde só
admins podem enviar arquivos.

### Criando um admin

1. No painel do Supabase: **Authentication → Users → Add user** (marque *Auto Confirm User*).
2. No SQL Editor, rode:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-do-admin@exemplo.com';
   ```

3. Recomendado: em **Authentication → Sign In / Providers**, desative
   *Allow new users to sign up*.
