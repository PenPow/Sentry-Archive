FROM frolvlad/alpine-glibc:alpine-3.11_glibc-2.31

RUN apk update && apk add curl
RUN curl -fsSL https://deno.land/x/install/install.sh | sh && mv /root/.deno/bin/deno /bin/deno

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

WORKDIR /app

COPY config.ts ./
COPY deps.ts ./
COPY importMap.json ./
COPY /src/bot ./src/bot
COPY /src/common ./src/common
EXPOSE 1235

RUN deno cache deps.ts
RUN deno cache config.ts
RUN for f in $(find src/ -name '*.ts'); do deno cache --import-map ./importMap.json $f; done

ENTRYPOINT ["deno"]

CMD [ "run", "-A", "--unstable", "--import-map", "./importMap.json", "./src/bot/mod.ts" ]