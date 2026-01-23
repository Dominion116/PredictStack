
import axios from 'axios';

export interface PolymarketMetadata {
    question: string;
    description: string;
    image: string;
    icon: string;
    category: string;
    outcomes: string[];
    liveOdds?: {
        yes: number;
        no: number;
    };
}

const CLOB_API_BASE = 'https://clob.polymarket.com';

/**
 * Fetches rich metadata from Polymarket for a given condition ID.
 * This allows us to display images and comparison odds on the frontend
 * without storing them on the Stacks blockchain.
 */
export async function fetchPolymarketMetadata(conditionId: string): Promise<PolymarketMetadata | null> {
    try {
        // Fetch market details from Polymarket CLOB
        const response = await axios.get(`${CLOB_API_BASE}/markets/${conditionId}`);
        const data = response.data;

        if (!data) return null;

        // Extract odds if available
        let liveOdds;
        if (data.tokens && data.tokens.length === 2) {
            // Note: In a real app, you'd fetch the actual orderbook or mid-price.
            // For now, we'll look for the 'price' field if Polymarket provides it in this summary.
            // If not, we could hit the 'price' endpoint.
        }

        return {
            question: data.question,
            description: data.description,
            image: data.image || '',
            icon: data.icon || '',
            category: data.category || 'General',
            outcomes: data.outcomes || ['Yes', 'No'],
            liveOdds
        };
    } catch (error) {
        console.error(`Error fetching Polymarket metadata for ${conditionId}:`, error);
        return null;
    }
}

/**
 * Helper to get live prices for a set of condition IDs.
 * Useful for bulk updates on a markets list page.
 */
export async function fetchBulkPolymarketPrices(conditionIds: string[]) {
    // Implement if needed for list views
    return {};
}
