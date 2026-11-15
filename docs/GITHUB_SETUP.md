# Put this project on GitHub (manual steps)

Your code is already a git repo on your PC:

- **Folder:** `d:\TMSI\web`
- **Branch:** `main` (committed; not on GitHub yet)

Use **Method A** (website) if you do not want the agent or CLI to connect for you.

---

## Method A — GitHub website + git push (recommended)

### Step 1: Sign in to GitHub

Open [https://github.com](https://github.com) and sign in (or create an account).

### Step 2: Create an empty repository

1. Click **+** (top right) → **New repository**.
2. **Repository name:** e.g. `tmsi-laps` (your choice).
3. **Private** or **Public** — your choice.
4. **Do not** check “Add a README”, “Add .gitignore”, or “Choose a license” (the project already has files).
5. Click **Create repository**.

GitHub shows a page with setup commands. Keep that tab open.

### Step 3: Copy your repository URL

On that page, copy the **HTTPS** URL, for example:

`https://github.com/YOUR_USERNAME/tmsi-laps.git`

### Step 4: Link your PC folder to GitHub

Open **PowerShell** and run (replace the URL with yours):

```powershell
cd d:\TMSI\web
git remote add origin https://github.com/YOUR_USERNAME/tmsi-laps.git
git branch -M main
git push -u origin main
```

### Step 5: Sign in when Git asks

- A browser window or credential prompt may appear — sign in with your GitHub account.
- If you use **two-factor authentication**, you may need a **Personal Access Token** instead of a password:
  1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
  2. Generate token with **repo** scope.
  3. Use the token as the password when `git push` asks.

### Step 6: Confirm on GitHub

Refresh the repository page — you should see your files (`src`, `supabase`, `package.json`, etc.).

---

## Method B — GitHub CLI (optional)

Only if you installed [GitHub CLI](https://cli.github.com/) and want one command after login:

```powershell
gh auth login
cd d:\TMSI\web
gh repo create tmsi-laps --private --source=. --remote=origin --push
```

---

## After GitHub — Vercel (next)

1. [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo.
2. Root Directory: leave **empty** (this repo is already the app).
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

Details: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

---

## Do not commit secrets

| File | Action |
|------|--------|
| `.env.local` | Stays on your PC only (gitignored) |
| `.env.example` | Safe template (no real keys) |
| `SUPABASE_SERVICE_ROLE_KEY` | Never on GitHub or Vercel |