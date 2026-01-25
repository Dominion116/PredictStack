// Approximate block time for Stacks in seconds (10 minutes)
export const SECONDS_PER_BLOCK = 600;

// Approximate current block height (Testnet)
// In a real app, you would fetch this from the Stacks Node API
export const CURRENT_BLOCK_HEIGHT = 3750000;

/**
 * Converts a Stacks block height to an estimated Javascript Date object.
 * @param blockHeight The target block height
 * @returns Date object representing the estimated time
 */
export function blockToDate(blockHeight: number): Date {
    const blocksRemaining = blockHeight - CURRENT_BLOCK_HEIGHT;
    const secondsRemaining = blocksRemaining * SECONDS_PER_BLOCK;
    const now = Date.now();
    return new Date(now + (secondsRemaining * 1000));
}

/**
 * Formats a date relative to now (e.g., "in 5 days", "2 weeks ago")
 * or returns a standard date string if far in the future used for resolution dates.
 */
export function formatResolutionDate(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return "Ended " + date.toLocaleDateString();
    }
    
    if (diffDays === 0) {
        return "Ends Today";
    }
    
    if (diffDays === 1) {
        return "Ends Tomorrow";
    }

    if (diffDays < 30) {
        return `Ends in ${diffDays} days`;
    }

    return `Ends ${date.toLocaleDateString()}`;
}
