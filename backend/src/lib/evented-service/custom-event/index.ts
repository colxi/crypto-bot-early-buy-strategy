
// Polyfill of CustomEvent for Node Environments 
export class CustomEvent<T> extends Event {
  constructor(type: string, detail: { detail: T }) {
    super(type)
    this.detail = detail.detail
  }
  public readonly detail: T
}
