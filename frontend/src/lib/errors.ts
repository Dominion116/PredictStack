export const CONTRACT_ERRORS: Record<number, string> = {
  100: 'Not authorized',
  101: 'Market not found',
  102: 'Market already resolved',
  103: 'Market not yet resolved',
  104: 'Invalid outcome',
  105: 'Insufficient balance',
  106: 'Already claimed',
  107: 'No position found',
  108: 'Wrong outcome — bet is on losing side',
  109: 'Platform is paused',
  110: 'Invalid amount',
  111: 'Deadline has already passed',
  112: 'Deadline has not passed yet',
  113: 'Market is cancelled',
  114: 'Market is not cancelled',
  115: 'Contract already initialized',
  116: 'Contract not initialized',
  117: 'Invalid market reference',
  118: 'Transfer failed',
  119: 'Pool is empty',
  120: 'Market is still active',
  121: 'Slippage tolerance exceeded',
};

export function getContractErrorMessage(code: number): string {
  return CONTRACT_ERRORS[code] ?? `Unknown contract error (u${code})`;
}
