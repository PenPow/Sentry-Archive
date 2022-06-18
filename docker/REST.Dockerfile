FROM denoland/deno:alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry REST Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY /src/rest /src/rest
COPY /src/common /src/common
EXPOSE 1236

RUN [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/rest/mod.ts" ]