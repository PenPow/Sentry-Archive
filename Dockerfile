FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY /src/bot ./src/bot
COPY /src/common ./src/common

RUN npm run build

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:bot" ]