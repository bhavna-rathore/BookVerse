# Debian-based (glibc), not alpine: bcrypt compiles/ships native bindings,
# and alpine's musl libc is a frequent source of native-module resolution
# friction (this project hit exactly that with an optional transitive
# dependency during testing) — glibc is the safer default here.
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Multer's diskStorage writes here — must exist even on a fresh container.
RUN mkdir -p images

ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
