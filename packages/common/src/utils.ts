/**
 * Type representing what is found in the config.toml object
 * 
 * @public
 */
export type Config = {
  /**
   * Options relating to the antivirus and clamav part of Sentry 
   */
  clamav: {
	/**
	 * Mirror to fetch the definitions from
	 * 
	 * @defaultValue https://mirror.penpow.dev
	 */
    MIRROR: string;
  };
  /**
   * Generic options relating to discord
   */
  discord: {
	/**
	 * The public key used for encryption
	 */
    PUBLIC_KEY: string;
	/**
	 * The token used for authentication
	 */
    TOKEN: `${string}.${string}.${string}`;
  };
  /**
   * Options used for our actiions package
   */
  interval: {
	/**
	 * The API key used in prototyping and development
	 */
    DEV_API_KEY: string;
	/**
	 * The API key used in production
	 */
    PRODUCTION_API_KEY: string;
  };
  /**
   * Configuration options relating to the phishertools domain package
   */
  phishertools: {
	/**
	 * The port that phishertools should lisen on
	 * 
	 * @defaultValue 3001
	 */
	PORT: number;
  };
  /**
   * Options relating to the REST proxy, used for shared ratelimiting
   */
  proxy: {
	/**
	 * The discord API version we want to connect with.
	 * 
	 * @remarks ⚠️ Values other than 10 are unsupported 
	 * @defaultValue 10
	 */
    API_VERSION: 6 | 7 | 8 | 9 | 10;
	/**
	 * The port that the REST proxy should lisen on
	 * 
	 * @defaultValue 3000
	 */
    PORT: string;
  };
  /**
   * Options regarding the main bot instance, sentry
   */
  sentry: {
	/**
	 * The URL that we should use to connect to our postgres instance with.
	 * 
	 * This is different from the database URL we have hard-coded into the prisma schema (`postgresql://sentry:postgres@localhost:5432/mydb?schema=public`). The one in the schema is used during development, and it connects to the prisma instance from a local machine. The URL specified in this config is used for connecting at runtime.
	 * 
	 * @defaultValue postgresql://sentry:postgres\@postgres:5432/mydb?schema=public
	 */
    DATABASE_URL: `postgresql://${string}:${string}@${string}:${number}/${string}`;
	/**
	 * Encryption key used for connecting to the database and encrypting sensitive information. Generated through one of the interval actions.
	 */
    ENCRYPTION_KEY: string;
	/**
	 * The port that Sentry should listen on
	 * 
	 * @defaultValue 8080
	 */
	PORT: number;
  };
};