# GitHub setup (done locally)

The app lives in `d:\TMSI\web` as its own git repo (`main` branch, initial commit).

**Not pushed yet** — GitHub CLI is not logged in on this machine.

## 1. Log in to GitHub

In PowerShell:

```powershell
gh auth login
```

Choose: **GitHub.com** → **HTTPS** → authenticate in the browser.

## 2. Create the remote repo and push

```powershell
cd d:\TMSI\web
gh repo create tmsi-laps --private --description "TMSI-LAPS web app" --source=. --remote=origin --push
```

If `tmsi-laps` is taken, pick another name:

```powershell
gh repo create YOUR-REPO-NAME --private --source=. --remote=origin --push
```

## 3. Connect Vercel

Import the new repo at [vercel.com/new](https://vercel.com/new). No root subdirectory needed if the repo **is** the `web` folder.

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

## Secrets

- `.env.local` is gitignored — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel only.
- Never commit `SUPABASE_SERVICE_ROLE_KEY`.