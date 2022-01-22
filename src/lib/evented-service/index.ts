import { EventsDictionary } from './types'

export default class EventedService<
  E_DICTIONARY extends EventsDictionary = EventsDictionary,
  > {
  constructor(eventsDictionary: (keyof E_DICTIONARY)[]) {
    this.#subscribers = eventsDictionary.reduce((acc, eventName) => {
      acc[eventName] = new Set()
      return acc
    }, {} as any)

    this.Event = eventsDictionary.reduce((acc, eventName) => {
      acc[eventName] = eventName
      return acc
    }, {} as any)

    Object.seal(this.Event)
    Object.freeze(this.Event)
  }

  /**
   * Collection of active subscribers grouped by event name
   */
  readonly #subscribers: Record<keyof E_DICTIONARY, Set<E_DICTIONARY[keyof E_DICTIONARY]>>

  /**
   * Enum alike object containing all the event names
   */
  readonly Event: { [K in keyof E_DICTIONARY]: Extract<keyof E_DICTIONARY, K> }

  /**
   * Iterates the list of subscribers and executes the callback, for a given event name
   */
  protected dispatchEvent<E_NAME extends keyof E_DICTIONARY>(
    ...[eventName, eventData]: Parameters<E_DICTIONARY[E_NAME]>[0] extends void
      ? [E_NAME]
      : [E_NAME, Parameters<E_DICTIONARY[E_NAME]>[0]]
  ): void {
    for (const eventHandler of this.#subscribers[eventName]) {
      eventHandler(eventData)
    }
  }

  /**
   * Add the provided callback function to the list of subscribers for a given event name
   */
  public subscribe<E_NAME extends keyof E_DICTIONARY, E_HANDLER extends E_DICTIONARY[E_NAME]>(
    eventName: E_NAME,
    eventHandler: E_HANDLER
  ): void {
    this.#subscribers[eventName].add(eventHandler)
  }

  /**
   * Remove the provided callback function to the list of subscribers for a given event name
   */
  public unsubscribe<E_NAME extends keyof E_DICTIONARY, E_HANDLER extends E_DICTIONARY[E_NAME]>(
    eventName: E_NAME,
    eventHandler: E_HANDLER
  ): void {
    this.#subscribers[eventName].delete(eventHandler)
  }
}