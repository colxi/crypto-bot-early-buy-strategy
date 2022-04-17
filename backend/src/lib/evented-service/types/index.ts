import { CustomEvent } from '../custom-event'

export type EventsDictionary = Record<string, (event: CustomEvent<any>) => void>

