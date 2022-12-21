FROM clamav/clamav:0.105_base

LABEL org.opencontainers.image.source="https://github.com/penpow/sentry"
LABEL org.opencontainers.image.description="Sentry ClamAV Image"

ADD /docker/clamav/freshclam.conf ./
ADD /docker/clamav/clamd.conf ./

RUN freshclam