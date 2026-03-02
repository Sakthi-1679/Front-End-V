# Front-End-V

A React + Vite front-end for the VKM app.  
The project is split into two separately-deployed services:

| Service | Stack | Hosted on |
|---------|-------|-----------|
| **Frontend** (this repo – `client/`) | React 18, Vite, TypeScript, Tailwind | Vercel |
| **Backend** (separate repo) | Node.js / Express REST API | Vercel |

---

## How to host on Vercel

### 1 – Deploy the Backend first

1. Open [vercel.com](https://vercel.com) → **Add New Project** → import the backend repository.
2. Vercel will auto-detect Node.js.  Set any required environment variables (database URL, JWT secret, etc.) in **Settings → Environment Variables**.
3. Click **Deploy**.  
4. After the deployment finishes, copy the production URL shown on the dashboard (e.g. `https://your-backend.vercel.app`).

---

### 2 – Deploy the Frontend (this repo)

1. Open [vercel.com](https://vercel.com) → **Add New Project** → import **this** repository.
2. In the **Configure Project** screen set:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite *(Vercel detects this automatically)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add an **Environment Variable**:
   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://your-backend.vercel.app/api` |
   *(Replace the URL with the one you copied in Step 1.)*
4. Click **Deploy**.

---

### 3 – Verify the connection

After both deployments succeed:

- Open the frontend URL (e.g. `https://your-frontend.vercel.app`).
- Try logging in or loading products — requests will be sent directly to `VITE_API_URL`.
- Check the browser **Network** tab to confirm API calls reach `https://your-backend.vercel.app/api/...` and return `200` responses.

---

## How API URL resolution works

`client/src/services/storage.ts` picks the backend URL in this order:

1. **`VITE_API_URL` env var** – set this in Vercel's Environment Variables for production.
2. **`http://localhost:3001/api`** – used automatically when running locally (`npm run dev`).
3. **`/api`** – relative-path fallback (same-origin proxy or Vercel rewrites).

---

## Local development

```bash
# Install dependencies
cd client
npm install

# Start the dev server (proxies /api → localhost:3001)
npm run dev
```

The Vite dev server automatically proxies `/api/*` requests to `http://localhost:3001` (see `vite.config.ts`), so the backend must be running locally on port 3001.
