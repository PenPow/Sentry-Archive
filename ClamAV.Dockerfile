FROM node:18-bullseye-slim

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry ClamAV Docker Image"

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update
RUN apt install -y sudo curl wget
RUN echo "deb http://http.us.debian.org/debian stable main contrib non-free" | sudo tee -a /etc/apt/sources.list
RUN apt update
RUN apt install -y clamav clamav-daemon clamav-base clamav-docs clamav-freshclam clamav-milter clamav-testfiles libclamav-dev libclamav9 libclamunrar9 build-essential python3

RUN clamconf -g freshclam.conf > freshclam.conf
RUN clamconf -g clamd.conf > clamd.conf
RUN clamconf -g clamav-milter.conf > clamav-milter.conf

RUN freshclam

COPY package*.json ./
COPY tsconfig.json ./

RUN npm i

COPY ./src/antivirus ./src/antivirus
COPY ./src/common ./src/common
COPY ./prisma ./prisma

RUN npx prisma generate
RUN npm run build

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:av" ]