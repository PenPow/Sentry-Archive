FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Rest Proxy"

WORKDIR /app

RUN apk add --no-cache python3 make g++

EXPOSE 8080

COPY tsconfig.json ./
COPY package*.json ./

RUN npm i

COPY ./src/proxy ./src/proxy
COPY ./src/common ./src/common
COPY config.toml ./config.toml

RUN npm run build

ENTRYPOINT [ "npm" ]
CMD [ "run", "start:proxy" ]