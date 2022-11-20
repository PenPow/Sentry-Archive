interface ISuccessfulResponse {
	success: true,
	data: {
		name: string,
		infected: boolean,
		viruses: string[]
	}
}

interface IErrorResponse {
	success: false,
	error: string
}

export type IClamAVResponse = ISuccessfulResponse | IErrorResponse