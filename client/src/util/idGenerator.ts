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

  next(): string {
    const next = `${this.prefix}${this.currentValue}`;
    this.currentValue += 1;
    return next;
  }
}

const idGenerator = new IdGenerator({ initialValue: 100 });

export default idGenerator;
