FROM denoland/deno:alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY .env .
COPY /src/bot /src/bot
COPY /src/common /src/common
EXPOSE 1235

RUN [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/bot/mod.ts" ]