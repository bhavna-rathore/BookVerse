# Deploying BookVerse

The app reads all configuration from environment variables — no code changes
should be needed to deploy it. This is the actual setup in use: **Render for
the API, Vercel for the client, MongoDB Atlas for the database.**

## 1. Database — MongoDB Atlas (free tier)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user and allow network access from anywhere (0.0.0.0/0)
   — Render's outbound IPs aren't fixed on the free tier, so this is the
   practical setting, not just the easy one.
3. Copy the connection string — this is your `MONGO_URL`.

## 2. API — Render web service

- **Root directory:** `api`
- **Build command:** `npm install`
- **Start command:** `node index.js`
- **Environment variables** (Render dashboard → your api service →
  **Environment** tab — not a `.env` file, Render doesn't read one):
  | Key | Value |
  |---|---|
  | `MONGO_URL` | your Atlas connection string |
  | `JWT_SECRET` | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
  | `PORT` | Render sets this automatically — leave unset |

  Saving an env var normally triggers an automatic redeploy. If the app still
  crashes with `JWT_SECRET is required` after saving, double-check it's on
  the **api** service specifically (not a client/static service, not an
  unattached environment group), then trigger **Manual Deploy → Deploy
  latest commit** to be sure the running instance actually picked it up.

  Once deployed, note the public URL (e.g. `https://bookverse-api.onrender.com`).

## 3. Client — Vercel

- **Root directory:** `client`
- Framework preset: Vercel auto-detects Create React App (build command
  `npm run build`, output directory `build`) — no manual config needed there.
- **Environment variable** (Vercel dashboard → project → **Settings →
  Environment Variables**):
  | Key | Value |
  |---|---|
  | `REACT_APP_API_URL` | `https://<your-render-api-host>/api` — the URL from step 2, with `/api` appended |

  `REACT_APP_API_URL` is read at **build time** (Create React App bakes it
  into the static bundle) — set it *before* triggering a build, and redeploy
  after changing it; it won't retroactively apply to an existing build.
- **`client/vercel.json`** — required for React Router. Vercel serves a
  static build with no server behind it, so without a rewrite rule, any
  route other than `/` (e.g. `/post/:id`, `/admin`, a refresh on any page)
  404s instead of falling back to `index.html`. This file is already in the
  repo:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

## 4. Point the two at each other

The API's CORS is currently wide open (`app.use(cors())`, no origin
allowlist) — fine for a demo, but if you lock it down later, add the
client's deployed origin to the allowlist or the client won't be able to
reach the API from a browser.

## 5. Smoke test

- Visit the client URL, register an account, write a post, upload a cover
  image, leave a comment.
- `node api/scripts/makeAdmin.js <username>` (run locally against the same
  `MONGO_URL`) to promote your account and confirm the Admin panel loads.

## What's intentionally not included here

No CDN/image-hosting migration, no custom domain/SSL setup (most hosts
handle this automatically), no staging environment. Add those if a specific
need for them shows up — not before.
