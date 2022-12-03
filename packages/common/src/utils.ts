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
    API_VERSION: 6 | 7 | 8 | 9 | 10;
	PORT: string;
  };
  sentry: {
    DATABASE_URL: `postgresql://${string}:${string}@${string}:${number}/${string}`;
    ENCRYPTION_KEY: string;
  };
};
