
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

