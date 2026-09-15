export class TimeInterval {
  private constructor(
    public readonly startAt: string,
    public readonly endAt: string,
  ) {}

  static create(startAt: string, endAt: string): TimeInterval {
    return new TimeInterval(
      new Date(startAt).toISOString(),
      new Date(endAt).toISOString(),
    );
  }
}
