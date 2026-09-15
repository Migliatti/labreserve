export type DomainErrorCode = 'INVALID_TIME_RANGE' | 'RESERVATION_ALREADY_CANCELLED';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
  }
}
