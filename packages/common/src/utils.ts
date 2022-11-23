export type Config = {
  clamav: {
    MIRROR: string;
  };
  discord: {
    PUBLIC_KEY: string;
    TOKEN: `${string}.${string}.${string}`;
  };
  fastify: {
    PORT: number;
  };
  interval: {
    DEV_API_KEY: string;
    PRODUCTION_API_KEY: string;
  };
  proxy: {
    PORT: string;
  };
  sentry: {
    DATABASE_URL: `postgresql://${string}:${string}@${string}:${number}/${string}`;
    ENCRYPTION_KEY: string;
  };
};
