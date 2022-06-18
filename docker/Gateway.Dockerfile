FROM denoland/deno:alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Gateway Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY /src/gateway /src/gateway
COPY /src/common /src/common

RUN [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/gateway/mod.ts" ]