FROM node:18-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

RUN apk update && apk add --no-cache libc6-compat python3 make g++ openssl1.1-compat

WORKDIR /app

RUN npm i turbo turbo-linux-64 -g
COPY . .
RUN turbo prune --scope=sentry --docker

FROM node:18-alpine AS installer

RUN apk update && apk add --no-cache libc6-compat python3 make g++ openssl1.1-compat

WORKDIR /app

COPY .gitignore .gitignore
COPY --from=builder /app/out/json .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

RUN npm i turbo turbo-linux-64 -g
RUN npm i

COPY --from=builder /app/out/full .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=sentry

FROM node:18-alpine as runner

RUN apk update && apk add --no-cache libc6-compat python3 make g++ openssl1.1-compat

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sentry
USER sentry

COPY --from=installer /app/apps/bot/package.json .
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer --chown=sentry:nodejs /app/apps/bot/dist ./dist

ENTRYPOINT [ "node" ]
CMD [ "--no-warnings", "--experimental-specifier-resolution=node", "dist/index.js" ]