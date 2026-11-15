# TMSI–LAPS Web Application

React 19 + TypeScript + Tailwind CSS v4 + Vite.

## Development

```bash
npm install
npm run dev
```

Open the routes listed in `../docs/IMPLEMENTATION_STATUS.md` and compare layout to reference PNGs in `public/assets/reference/`.

## Supabase

Migrations are in `supabase/migrations/`. **Execute manually** per `supabase/migrations/README.md` before expecting live auth or CRUD.

Copy `/.env.example` to `.env.local` for local dev. On Vercel set the same `VITE_*` keys in project **Environment Variables**.

## Vercel

See **[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)** for import steps, root directory `web`, and Supabase auth URLs.

## Client source materials

Original client files remain under `../TMSI-LUMINARIAN ACADEMY OF PHILOSOPHICAL STUDIES/` (unchanged). Application static assets are copied into `public/assets/`.