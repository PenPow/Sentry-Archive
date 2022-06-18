FROM denoland/deno:latest

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY /src/bot /src/bot
COPY /src/common /src/common
EXPOSE 1235

ENTRYPOINT [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/bot/mod.ts" ]