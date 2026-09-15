import { DomainError } from './domain-error.js';

export { DomainError } from './domain-error.js';

const ISO_8601_WITH_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export class TimeInterval {
  private constructor(
    public readonly startAt: string,
    public readonly endAt: string,
  ) {}

  static create(startAt: string, endAt: string): TimeInterval {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (
      !ISO_8601_WITH_TIMEZONE.test(startAt)
      || !ISO_8601_WITH_TIMEZONE.test(endAt)
      || Number.isNaN(start.getTime())
      || Number.isNaN(end.getTime())
      || end <= start
    ) {
      throw new DomainError('INVALID_TIME_RANGE', 'O término deve ser posterior ao início.');
    }

    return new TimeInterval(start.toISOString(), end.toISOString());
  }

  overlaps(other: TimeInterval): boolean {
    return this.startAt < other.endAt && this.endAt > other.startAt;
  }
}
