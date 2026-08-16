# Deploying BookVerse

The app reads all configuration from environment variables — no code changes
should be needed to deploy it to a typical PaaS. This guide is written for
Render, but the same three pieces (database, API, static client) map onto
Fly.io, Railway, or Vercel+Render just as directly.

## 1. Database — MongoDB Atlas (free tier)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user and allow network access from anywhere (0.0.0.0/0)
   or your host provider's IP range.
3. Copy the connection string — this is your `MONGO_URL`.

## 2. API — deploy `api/` as a web service

Works as-is on Render/Railway/Fly with no Dockerfile required (they can build
directly from `api/package.json`), or with the included `api/Dockerfile` if
your host prefers a container.

- **Root directory:** `api`
- **Build command:** `npm install`
- **Start command:** `node index.js`
- **Environment variables:**
  | Key | Value |
  |---|---|
  | `MONGO_URL` | your Atlas connection string |
  | `JWT_SECRET` | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
  | `PORT` | usually set automatically by the host — leave unset if so |

Once deployed, note the public URL (e.g. `https://bookverse-api.onrender.com`).

## 3. Client — deploy `client/` as a static site

- **Root directory:** `client`
- **Build command:** `npm install && npm run build`
- **Publish directory:** `build`
- **Environment variables:**
  | Key | Value |
  |---|---|
  | `REACT_APP_API_URL` | `https://<your-api-host>/api` — the API URL from step 2, with `/api` appended |

`REACT_APP_API_URL` is read at **build time** (Create React App bakes it into
the static bundle), so it must be set before the build command runs, not
after.

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
