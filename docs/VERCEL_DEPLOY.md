# Deploy TMSI–LAPS web to Vercel

## 1. Import project

**Option A — Vercel Dashboard (recommended)**

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your Git repository (GitHub/GitLab/Bitbucket), **or** use **Deploy without Git** and upload the `web` folder.
3. If the repo root is `TMSI` (parent folder), set:
   - **Root Directory:** `web`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables (Production + Preview):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |

5. Deploy.

**Option B — CLI (from `web` folder)**

```powershell
cd d:\TMSI\web
npm install
npx vercel login
npx vercel
```

Follow prompts (link or create project). Add env vars in the dashboard or:

```powershell
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
npx vercel --prod
```

## 2. Supabase (required for login)

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL configuration**:

- **Site URL:** your Vercel URL (e.g. `https://your-app.vercel.app`)
- **Redirect URLs:** add the same URL and `https://your-app.vercel.app/**`

Without this, sign-in may fail on production.

## 3. SPA routing

[`vercel.json`](../vercel.json) rewrites all routes to `index.html` so `/dashboard`, `/admin`, `/courses/...` work on refresh.

## 4. After deploy

- Open the site → home page loads.
- Test login, dashboard, admin (staff account).
- Run pending SQL migrations in Supabase if not already applied (`supabase/migrations/README.md`).

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — local scripts only.