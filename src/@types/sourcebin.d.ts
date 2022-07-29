declare module 'sourcebin' {
	export function url(
		url: string,
	): {
		key: string;
		url: string;
		short: string;
	};

	export function get(
		url: string,
		options?: {
			fetchContent?: boolean;
		},
	): Promise<SourceBin>;

	export function create(
		bins: {
			name?: string;
			content: string;
			language?: string | number;
		}[],
		options?: {
			title?: string;
			description?: string;
		},
	): Promise<SourceBin>;

	class SourceBin {
		public constructor(
			key: string,
			data: {
				key: string;
				url: string;
				short: string;
				title?: string | undefined;
				description?: string | undefined;
				views: number;
				created: string;
				timestamp?: number;
				files: File[];
			},
		);

		public get key(): string;
		public get url(): string;
		public get short(): string;
		public get title(): string | undefined;
		public get description(): string | undefined;
		public get views(): number;
		public get created(): string;
		public get timestamp(): number;
		public get files(): File[];
	}

	class File {
		public public constructor(
			key: string,
			index: number,
			data: {
				name?: string;
				content: string;
				languageId?: number;
				language?: {
					name: string;
					extension: string;
					aliases: string[];
					aceMode: string;
				};
			},
		);

		public get name(): string;
		public get content(): string;
		public get languageId(): number;
		public get language(): {
			name: string;
			extension: string;
			aliases: string[];
			aceMode: string;
		};
	}
}
