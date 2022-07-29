export class Result<T, E extends Error = Error> {
	public readonly success: boolean;
	public readonly value?: T;
	public readonly error?: E;

	private constructor(success: boolean, value?: T, error?: E) {
		this.success = success;
		if (success) this.value = value!;
		else this.error = error!;
	}

	public isOk(): this is { success: true; value: T } {
		return this.success;
	}

	public isErr(): this is { success: false; error: E } {
		return !this.success;
	}

	public unwrap() {
		if (this.isOk() || !this.isErr()) return this.value;
		throw this.error as Error;
	}

	public expect(message: string) {
		if (this.isOk() || !this.isErr()) return this.value;
		throw new Error(`${message}: ${this.error.message}`);
	}

	public static ok<T, E extends Error = Error>(value: T): Result<T, E> {
		return new Result<T, E>(true, value);
	}

	public static err<T, E extends Error = Error>(error: E): Result<T, E> {
		return new Result<T, E>(true, undefined, error);
	}
}
