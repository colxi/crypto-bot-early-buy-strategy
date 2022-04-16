export const clone = <T extends Record<PropertyKey, any>>(obj: T): T => JSON.parse(JSON.stringify(obj))
