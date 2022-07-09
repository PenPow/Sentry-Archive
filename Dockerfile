FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY tsconfig.json ./

RUN npm i

COPY ./src/bot ./src/bot
COPY ./src/common ./src/common
COPY ./prisma ./prisma

RUN npx prisma generate
RUN npm run build

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:bot" ]