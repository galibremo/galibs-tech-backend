import { HttpException, HttpStatus } from '@nestjs/common';

export type DomainErrorMeta = Record<string, unknown>;

export class DomainError extends HttpException {
	constructor(
		public readonly code: string,
		message: string,
		status: HttpStatus = HttpStatus.BAD_REQUEST,
		public readonly meta: DomainErrorMeta = {},
	) {
		super(
			{
				code,
				message,
				meta,
			},
			status,
		);
	}
}

export const validationFailed = (message: string, meta?: DomainErrorMeta): DomainError =>
	new DomainError('validation_failed', message, HttpStatus.UNPROCESSABLE_ENTITY, meta);

export const badRequestError = (message: string, meta?: DomainErrorMeta): DomainError =>
	new DomainError('bad_request', message, HttpStatus.BAD_REQUEST, meta);

export const unauthorizedError = (message: string, meta?: DomainErrorMeta): DomainError =>
	new DomainError('unauthorized', message, HttpStatus.UNAUTHORIZED, meta);

export const badGatewayError = (
	code: string,
	message: string,
	meta?: DomainErrorMeta,
): DomainError => new DomainError(code, message, HttpStatus.BAD_GATEWAY, meta);

export const unprocessableError = (
	code: string,
	message: string,
	meta?: DomainErrorMeta,
): DomainError => new DomainError(code, message, HttpStatus.UNPROCESSABLE_ENTITY, meta);

export const conflictError = (code: string, message: string, meta?: DomainErrorMeta): DomainError =>
	new DomainError(code, message, HttpStatus.CONFLICT, meta);

export const forbiddenError = (
	code: string,
	message: string,
	meta?: DomainErrorMeta,
): DomainError => new DomainError(code, message, HttpStatus.FORBIDDEN, meta);

export const notFoundError = (code: string, message: string, meta?: DomainErrorMeta): DomainError =>
	new DomainError(code, message, HttpStatus.NOT_FOUND, meta);

export type DatabaseUniqueViolation = { code: '23505'; constraint?: string };

const hasUniqueViolationCode = (error: unknown): error is DatabaseUniqueViolation =>
	typeof error === 'object' &&
	error !== null &&
	(error as { code?: unknown }).code === '23505';

/**
 * Returns the underlying pg unique-violation error (code 23505, with `constraint`)
 * or null. drizzle-orm wraps driver errors in a `DrizzleQueryError` whose `cause`
 * is the pg error, so both the error and its `cause` are checked.
 */
export const getDatabaseUniqueViolation = (error: unknown): DatabaseUniqueViolation | null => {
	if (hasUniqueViolationCode(error)) return error;
	const cause = typeof error === 'object' && error !== null ? (error as { cause?: unknown }).cause : undefined;
	return hasUniqueViolationCode(cause) ? cause : null;
};

export const isDatabaseUniqueViolation = (error: unknown): boolean =>
	getDatabaseUniqueViolation(error) !== null;
