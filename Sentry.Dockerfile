FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry Bot Image"

ENV NODE_NO_WARNINGS=1

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY tsconfig.json ./

RUN npm i

COPY ./prisma ./prisma
RUN npx prisma generate

COPY ./src/common ./src/common
COPY ./src/bot ./src/bot

RUN npm run build

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:bot" ]