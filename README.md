# Labelring

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

The frontend is a static Vite/React app hosted on **GitHub Pages**; the backend is **Supabase** (Postgres + Auth + Storage + Edge Functions).

- Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which builds the app and publishes `dist/` to GitHub Pages.
- Pushing changes under `supabase/` triggers `.github/workflows/supabase-deploy.yml`, which runs `supabase db push` and deploys the edge functions (`analyze-label`, `generate-label`) to the linked Supabase project.

### Required GitHub Actions secrets

| Secret | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL, used at build time |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (public-safe) |
| `SUPABASE_ACCESS_TOKEN` | Supabase management API token, used by the CLI to link/push/deploy |
| `SUPABASE_PROJECT_ID` | Supabase project ref (same value as above) |
| `SUPABASE_DB_PASSWORD` | Database password, needed for `supabase db push` |
| `LOVABLE_API_KEY` | AI gateway key used by the `analyze-label`/`generate-label` edge functions |

### GitHub Pages settings

In the repo's **Settings → Pages**, set the source to "GitHub Actions". If serving from a project page (`https://<user>.github.io/labelring/`), the Vite `base` is already set to `/labelring/` when `GITHUB_PAGES=true` (set by the workflow). If you switch to a custom domain or a user/organization page instead, update `base` in `vite.config.ts` accordingly.
