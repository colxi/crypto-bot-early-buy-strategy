

/**
 * 
 * Returns a boolean indicating if a string represents an amount in dollars (ended with $)
 * 
 */
export function isAmountInDollarsString(num: unknown): num is `${number}$` {
  if (typeof num !== 'string') return false
  if (Array.from(num).pop() !== '$') return false
  const number = Number(num.slice(0, -1))
  if (isNaN(number)) return false
  return true
}

/**
 * 
 * Extracts the number of an amount in dollars string
 * 
 */
export function parseAmountInDollarsString(num: `${number}$`): number {
  if (!isAmountInDollarsString(num)) throw new Error('Value is not an amount in dollars')
  const value = Number(num.slice(0, -1))
  if (isNaN(value)) throw new Error('Invalid amount in dollars')
  return value
}


/**
 * 
 * Returns a boolean indicating if a string represents a  percentage
 * 
 */
export function isPercentageString(num: unknown): num is `${number}%` {
  if (typeof num !== 'string') return false
  if (Array.from(num).pop() !== '%') return false
  const number = Number(num.slice(0, -1))
  if (isNaN(number)) return false
  return true
}


/**
 * 
 * Extracts the number of a percentage string
 * 
 */
export function parsePercentageString(num: `${number}%`): number {
  if (!isPercentageString(num)) throw new Error('Value is not a percentage')
  const value = Number(num.slice(0, -1))
  if (isNaN(value)) throw new Error('Invalid percentage string')
  return value
}


/**
 * 
 * Returns the difference betwen two values, as a percentage
 * 
 */
export function getPercentageDiff(a: number, b: number, precision: number = 2): number {
  if (!a) return 0
  return Number(toFixed((b - a) * 100 / a, precision))
}


/**
 * 
 * Returns the requested percentage of the provided value
 * 
 */
export function getPercentage(num: number, per: number): number {
  if (!per) return 0
  return (num / 100) * per
}

export function applyPercentage(num: number, per: number): number {
  return num + getPercentage(num, per)
}


/**
 * 
 * @param num 
 * @param limit 
 * @returns 
 */
export function toFixed(num: number, limit: number): string {
  const [units, decimals = '0'] = String(num).split('.')
  const formattedDecimals = decimals.substr(0, limit).padEnd(limit, '0')
  return (decimals)
    ? `${units}.${formattedDecimals}`
    : units
}

