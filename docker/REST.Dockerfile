FROM frolvlad/alpine-glibc:alpine-3.11_glibc-2.31

RUN apk update && apk add curl
RUN curl -fsSL https://deno.land/x/install/install.sh | sh && mv /root/.deno/bin/deno /bin/deno

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry REST Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY importMap.json ./
COPY /src/rest ./src/rest
COPY /src/common ./src/common
EXPOSE 1236

ENTRYPOINT ["deno"]

CMD [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/rest/mod.ts" ]