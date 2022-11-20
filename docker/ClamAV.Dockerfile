FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry ClamAV Broker"

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY tsconfig.json ./
COPY package*.json ./

RUN npm i

COPY ./src/antivirus ./src/antivirus
COPY ./src/common ./src/common
COPY config.toml ./config.toml

RUN npm run build

ENTRYPOINT [ "npm" ]
CMD [ "run", "start:antivirus" ]