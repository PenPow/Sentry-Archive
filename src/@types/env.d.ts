declare namespace NodeJS {
	export interface ProcessEnv {
		DISCORD: string;
		DEVELOPMENT: string;
		DEV_GUILD_ID: string;
		DEV_USER_ID: string;
		DEPLOY_ON_START: string;
		DEVELOPMENT_DATABASE_URL: string;
		DATABASE_URL: string;
		SENTRY_DSN: string;
		SENTRY_RELEASE: string?;
	}
}
