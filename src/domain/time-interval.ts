export class DomainError extends Error {
  constructor(
    public readonly code: 'INVALID_TIME_RANGE',
    message: string,
  ) {
    super(message);
  }
}

export class TimeInterval {
  private constructor(
    public readonly startAt: string,
    public readonly endAt: string,
  ) {}

  static create(startAt: string, endAt: string): TimeInterval {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (end <= start) {
      throw new DomainError('INVALID_TIME_RANGE', 'O término deve ser posterior ao início.');
    }

    return new TimeInterval(start.toISOString(), end.toISOString());
  }
}
