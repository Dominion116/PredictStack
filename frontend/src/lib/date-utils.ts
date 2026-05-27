// Approximate block time for Stacks in seconds (10 minutes)
export const SECONDS_PER_BLOCK = 600;

// Approximate current block height — kept as a static fallback.
// The market page uses resolve-time-iso from the backend instead of this.
export const CURRENT_BLOCK_HEIGHT = 3981916;

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

/**
 * Formats a date as a relative time string (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'Just now';
    }
    if (diffMin < 60) {
        return `${diffMin}m ago`;
    }
    if (diffHour < 24) {
        return `${diffHour}h ago`;
    }
    if (diffDay < 7) {
        return `${diffDay}d ago`;
    }
    return date.toLocaleDateString();
}

export function formatBlocksRemaining(currentBlock: number, targetBlock: number): string {
    const blocksLeft = targetBlock - currentBlock;
    if (blocksLeft <= 0) return 'Ended';
    const secondsLeft = blocksLeft * SECONDS_PER_BLOCK;
    const minutes = Math.floor(secondsLeft / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}
