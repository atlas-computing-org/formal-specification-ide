export class Counter {
  private count: number;

  constructor(start: number = 0) {
    this.count = start;
  }

  next(): number {
    return this.count++;
  }
}