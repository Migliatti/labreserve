import { DomainError } from './domain-error.js';

export { DomainError } from './domain-error.js';

const ISO_8601_WITH_TIMEZONE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isRealIsoDate(value: string): boolean {
  const parts = ISO_8601_WITH_TIMEZONE.exec(value);
  if (!parts) return false;
  const [yearPart, monthPart, dayPart, hourPart, minutePart, secondPart] = parts.slice(1, 7);
  if (!yearPart || !monthPart || !dayPart || !hourPart || !minutePart || !secondPart) return false;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const second = Number(secondPart);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute
    && date.getUTCSeconds() === second;
}

export class TimeInterval {
  private constructor(
    public readonly startAt: string,
    public readonly endAt: string,
  ) {}

  static create(startAt: string, endAt: string): TimeInterval {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (
      !isRealIsoDate(startAt)
      || !isRealIsoDate(endAt)
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
