/** cents → "$12.50" */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** cents USD + rate → "ل.ل 1,125,000" */
export function formatLbp(cents: number, exchangeRate: number): string {
  const lbp = Math.round((cents / 100) * exchangeRate);
  return `ل.ل ${lbp.toLocaleString('en-US')}`;
}

/** raw LBP integer → "ل.ل 1,125,000" */
export function formatLbpRaw(lbp: number): string {
  return `ل.ل ${lbp.toLocaleString('en-US')}`;
}

/** dollars string "12.50" → cents integer 1250 */
export function dollarsToCents(value: string): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** cents → "12.50" (for text input display) */
export function centsToString(cents: number): string {
  return (cents / 100).toFixed(2);
}
