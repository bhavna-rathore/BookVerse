# BookVerse

A community book-review platform. Readers write structured reviews (rating,
key takeaways, who-should-read), organize them by category, and discuss them
in threaded comments.

## Features

- **Auth & authorization** — JWT-based login, bcrypt-hashed passwords, and
  server-enforced ownership on every mutating route (you can only edit/delete
  your own posts, comments, and account). Role-based access control (`user`
  / `admin`) gates destructive moderation actions like deleting a category.
- **Book reviews** — create/edit/delete posts with a rating, summary, key
  takeaways, and an optional cover image upload.
- **Categories** — a real relational model (`Category` collection +
  `Post.categoryId` reference), not free text, so "Fiction" and "fiction"
  are never two different things.
- **Threaded comments** — nested replies with cascading delete (removing a
  comment removes its whole reply subtree).
- **Admin panel** — moderate categories, posts, and contact submissions from
  one place, gated both client-side and server-side.
- **Pagination & sorting** — list endpoints are paginated and sorted by the
  database (not the client), so "highest rated" is accurate across the full
  result set, not just the current page.
- **Contact form** — submissions are stored and readable from the admin
  panel.

## Tech stack

- **API:** Node, Express, MongoDB/Mongoose, JWT, bcrypt, Multer
- **Client:** React, React Router, Context + `useReducer`, Axios
- **Testing:** Jest + Supertest against a real in-memory MongoDB
  (`mongodb-memory-server`), plus React Testing Library for the frontend's
  shared hooks
- **CI:** GitHub Actions — runs the backend test suite and a production
  client build on every push/PR to `main`

## Getting started

### 1. API

```bash
cd api
cp .env.example .env   # fill in MONGO_URL and JWT_SECRET
npm install
npm run dev             # http://localhost:5000
```

`JWT_SECRET` is required — the server refuses to start without one. Generate
one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Client

```bash
cd client
cp .env.example .env    # REACT_APP_API_URL, defaults to localhost:5000/api
npm install
npm start                # http://localhost:3000
```

### 3. Create an admin account

There's no self-service admin signup by design. Register a normal account
through the app, then promote it:

```bash
cd api
npm run make-admin -- <your-username>
```

### 4. Optional: seed some data

```bash
# api/.env
SEED=true
SEED_CATEGORIES=true
```

then `POST /api/seed` (and restart the server once, to run the category
seed) will load `api/sampleData/`.

## Running the tests

```bash
cd api
npm test          # 60+ tests: auth, ownership, RBAC, comments, uploads, contact, sorting, search
```

```bash
cd client
npm test          # frontend tests for the shared usePosts/useComments hooks
```

Both run automatically in CI on every push/PR to `main` (see
`.github/workflows/ci.yml`).

## API documentation

See [`api/openapi.yaml`](api/openapi.yaml) for the full route reference
(request/response shapes, auth requirements, query parameters).

## Running with Docker

```bash
docker compose up --build
```

Brings up MongoDB, the API (port 5000), and the client (port 3000) together.
See `docker-compose.yml` for the wiring and `api/Dockerfile` /
`client/Dockerfile` for each image.

## Deploying

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for a step-by-step guide (MongoDB
Atlas + a PaaS host for the API + a static host for the client).

## Data migrations

`api/scripts/migrateCategories.js` is a one-time, idempotent backfill that
resolves each post's free-text `category` string to a real `Category`
document and sets `categoryId`. Safe to re-run — posts that already have a
`categoryId` are skipped.

```bash
cd api
npm run migrate:categories
```

## Project structure

```
api/
  models/       Mongoose schemas (User, Post, Category, Comment, Contact)
  routes/       Express route handlers
  middleware/   verifyToken (JWT), requireRole (RBAC)
  scripts/      One-off ops scripts (migrations, admin promotion)
  tests/        Jest + Supertest, against a real in-memory MongoDB
client/
  src/components/  Reusable UI pieces (Post, Comments, Pagination, TopBar...)
  src/pages/        Route-level screens
  src/hooks/        Shared data-fetching (usePosts, useComments)
  src/context/      Auth/theme global state (Context + useReducer)
```
