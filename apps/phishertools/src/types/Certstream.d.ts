declare module "certstream" {
	export default class CertStreamClient {
		public constructor(callback: (message: any) => void, skipHeartbeats?: boolean)

		public connect(url?: string): void
	}
}