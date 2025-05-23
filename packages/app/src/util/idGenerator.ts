class IdGenerator {
  private prefix: string;

  private currentValue: number;

  constructor({
    prefix = "",
    initialValue = 0,
  }: {
    prefix?: string;
    initialValue?: number;
  } = {}) {
    this.prefix = prefix;
    this.currentValue = initialValue;
  }

  setCurrentValue(value: number): void {
    this.currentValue = value;
  }

  next(): string {
    const next = `${this.prefix}${this.currentValue}`;
    this.currentValue += 1;
    return next;
  }
}

export default IdGenerator;
