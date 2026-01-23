
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
        // Use native fetch instead of axios for Next.js compatibility
        const response = await fetch(`${CLOB_API_BASE}/markets/${conditionId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Allow cross-origin requests
            mode: 'cors',
        });
        
        if (!response.ok) {
            console.error(`Polymarket API error: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        if (!data) return null;

        // Extract outcomes and odds from tokens array
        let outcomes: string[] = ['Yes', 'No'];
        let liveOdds: { yes: number; no: number } | undefined;
        
        if (data.tokens && Array.isArray(data.tokens) && data.tokens.length >= 2) {
            outcomes = data.tokens.map((t: any) => t.outcome || 'Unknown');
            
            // Get prices from tokens (they represent odds)
            const token0Price = data.tokens[0]?.price ?? 0.5;
            const token1Price = data.tokens[1]?.price ?? 0.5;
            
            // Typically first token is "Yes" equivalent, second is "No"
            liveOdds = {
                yes: token0Price,
                no: token1Price
            };
        }

        return {
            question: data.question || '',
            description: data.description || '',
            image: data.image || '',
            icon: data.icon || '',
            category: data.tags?.[0] || 'General',
            outcomes,
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

