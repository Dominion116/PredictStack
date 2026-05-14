export * from '@/api/client';
export * from '@/api/markets';
export * from '@/api/bets';
export * from '@/api/claims';
export * from '@/api/users';
export * from '@/api/platform';
// blockchain/contract-reads is NOT re-exported here — it statically imports
// @stacks/transactions which Turbopack cannot bundle for the browser.
// Import from '@/blockchain/contract-reads' directly, or use dynamic import.
