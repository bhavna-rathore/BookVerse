# --- build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# CRA bakes REACT_APP_* vars into the static bundle at build time, not at
# container start — so this has to be a build ARG, not a runtime ENV.
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# --- serve stage ---
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# React Router uses client-side routing — unknown paths must fall back to
# index.html instead of nginx's default 404.
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
