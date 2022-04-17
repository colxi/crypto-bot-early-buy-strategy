import { CustomEvent } from './custom-event'
import { EventsDictionary } from './types'

export default class EventedService<E_DICTIONARY extends EventsDictionary = EventsDictionary> {
  constructor() {
    this.#subscribers = {}
  }

  /**
   * Collection of active subscribers grouped by event name
   */
  readonly #subscribers: Record<PropertyKey, Set<E_DICTIONARY[keyof E_DICTIONARY]>>

  /**
   * 
   * Get the collection of subscribers for an event. If collections does not yet exist,
   * will be created
   * 
   */
  private getEventSubscribersCollection<E_NAME extends keyof E_DICTIONARY>(eventName: E_NAME) {
    if (!this.#subscribers[eventName]) this.#subscribers[eventName] = new Set()
    return this.#subscribers[eventName]
  }

  /**
   * Iterates the list of subscribers and executes the callback, for a given event name
   */
  protected dispatchEvent<E_NAME extends keyof E_DICTIONARY>(
    ...[eventName, eventData]: Parameters<E_DICTIONARY[E_NAME]>[0] extends void
      ? [E_NAME]
      : [E_NAME, Parameters<E_DICTIONARY[E_NAME]>[0] extends CustomEvent<infer T> ? T : never]
  ) {
    const eventHandlersCollection = this.getEventSubscribersCollection(eventName)
    const event = new CustomEvent(String(eventName), { detail: eventData })
    for (const eventHandler of eventHandlersCollection) {
      eventHandler(event)
      // stop Event Propagation if requested by user
      if (event.cancelBubble) break
    }
    return event
  }


  /**
   * Add the provided callback function to the list of subscribers for a given event name
   */
  public subscribe<E_NAME extends keyof E_DICTIONARY, E_HANDLER extends E_DICTIONARY[E_NAME]>(
    eventName: E_NAME,
    eventHandler: E_HANDLER
  ): void {
    const eventHandlersCollection = this.getEventSubscribersCollection(eventName)
    eventHandlersCollection.add(eventHandler)
  }


  /**
   * Remove the provided callback function to the list of subscribers for a given event name
   */
  public unsubscribe<E_NAME extends keyof E_DICTIONARY, E_HANDLER extends E_DICTIONARY[E_NAME]>(
    eventName: E_NAME,
    eventHandler: E_HANDLER
  ): void {
    const eventHandlersCollection = this.getEventSubscribersCollection(eventName)
    eventHandlersCollection.delete(eventHandler)
  }
}