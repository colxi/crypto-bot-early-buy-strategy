export function getDateAsDDMMYYYY(dateOrTimestamp: Date | number = new Date(), divider = '-'): string {
  const date = (typeof dateOrTimestamp === 'number')
    ? new Date(dateOrTimestamp)
    : dateOrTimestamp
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month < 10
    ? `${day}${divider}0${month}${divider}${year}`
    : `${day}${divider}${month}${divider}${year}`
}

export function getTimeAsHHMMSS(dateOrTimestamp: Date | number = new Date(), divider = ':'): string {
  const date = (typeof dateOrTimestamp === 'number')
    ? new Date(dateOrTimestamp)
    : dateOrTimestamp
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hour}${divider}${minute}${divider}${seconds}`
}

export enum TimeInMillis {
  ONE_SECOND = 1000,
  TWO_SECONDS = 1000 * 2,
  FIVE_SECONDS = 1000 * 5,
  TEN_SECONDS = 1000 * 10,
  ONE_MINUTE = 1000 * 60,
  TWO_MINUTES = 1000 * 60 * 2,
  FIVE_MINUTES = 1000 * 60 * 5,
  TEN_MINUTES = 1000 * 60 * 10,
  ONE_HOUR = 1000 * 60 * 60,
  TWO_HOURS = 1000 * 60 * 60 * 2,
  FIVE_HOURS = 1000 * 60 * 60 * 5,
  TEN_HOURS = 1000 * 60 * 60 * 10,
  ONE_DAY = 1000 * 60 * 60 * 24,
  TWO_DAYS = 1000 * 60 * 60 * 24 * 2,
  FIVE_DAYS = 1000 * 60 * 60 * 24 * 5,
  TEN_DAYS = 1000 * 60 * 60 * 24 * 10,
  ONE_WEEK = 1000 * 60 * 60 * 24 * 7,
  ONE_MONTH = 1000 * 60 * 60 * 24 * 30,
}

export enum TimeInSeconds {
  ONE_MINUTE = 60,
  TWO_MINUTES = 60 * 2,
  FIVE_MINUTES = 60 * 5,
  ONE_HOUR = 60 * 60,
  TWO_HOURS = 60 * 60 * 2,
  FIVE_HOURS = 60 * 60 * 5,
  ONE_DAY = 60 * 60 * 24,
  TWO_DAYS = 60 * 60 * 24 * 2,
  FIVE_DAYS = 60 * 60 * 24 * 5,
  ONE_WEEK = 60 * 60 * 24 * 7,
  ONE_MONTH = 60 * 60 * 24 * 30,
}