declare namespace NodeJS {
	export interface ProcessEnv {
		DISCORD: string;
		DEVELOPMENT: string;
		DEV_GUILD_ID: string;
		DEV_USER_ID: string;
		DEPLOY_ON_START: string;
	}
}
