export type ApplicationErrorCode =
  | 'RESOURCE_NOT_FOUND'
  | 'RESERVATION_NOT_FOUND'
  | 'RESERVATION_CONFLICT';

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
  }
}
