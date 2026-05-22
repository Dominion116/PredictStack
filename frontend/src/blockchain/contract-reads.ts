import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  boolCV,
  standardPrincipalCV,
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET, createNetwork } from '@stacks/network';
import { getContractConfig, NETWORK_ENV } from '@/lib/constants';

const config = getContractConfig();
const network = createNetwork(NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

function extractValue(clarityValue: any): any {
  if (!clarityValue) return null;
  if (typeof clarityValue !== 'object') return clarityValue;
  if ('value' in clarityValue && 'type' in clarityValue) {
    if (clarityValue.type === 'none') return null;
    return extractValue(clarityValue.value);
  }
  return clarityValue;
}

export interface QuotePrice {
  currentPriceBps: number;
  postTradePriceBps: number;
  priceImpactBps: number;
}

export interface QuoteShares {
  poolShareBps: number;
  projectedProfit: number;
  projectedPayout: number;
  entryFee: number;
}

export interface ContractEvent {
  event_type: string;
  tx_id: string;
  block_height: number;
  timestamp: number;
  data: any;
}

export async function isAddressAdmin(address: string): Promise<boolean> {
  if (!address) return false;
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.deployer,
      contractName: config.predictionMarket,
      functionName: 'is-address-admin',
      functionArgs: [standardPrincipalCV(address)],
      network,
      senderAddress: address,
    });

    const json: any = cvToJSON(response);
    if (json.success && json.value) {
      return Boolean(extractValue(json.value));
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getQuotePrice(
  marketId: number,
  outcome: boolean,
  amountMicro: number
): Promise<QuotePrice | null> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.deployer,
      contractName: config.predictionMarket,
      functionName: 'quote-price',
      functionArgs: [uintCV(marketId), boolCV(outcome), uintCV(amountMicro)],
      network,
      senderAddress: config.deployer,
    });

    const json: any = cvToJSON(response);
    if (json.success && json.value?.value) {
      const quote = json.value.value;
      return {
        currentPriceBps: Number(extractValue(quote['current-price-bps']) || 0),
        postTradePriceBps: Number(extractValue(quote['post-trade-price-bps']) || 0),
        priceImpactBps: Number(extractValue(quote['price-impact-bps']) || 0),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching price quote:', error);
    return null;
  }
}

export async function getQuoteShares(
  marketId: number,
  outcome: boolean,
  amountMicro: number
): Promise<QuoteShares | null> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.deployer,
      contractName: config.predictionMarket,
      functionName: 'quote-shares',
      functionArgs: [uintCV(marketId), boolCV(outcome), uintCV(amountMicro)],
      network,
      senderAddress: config.deployer,
    });

    const json: any = cvToJSON(response);
    if (json.success && json.value?.value) {
      const quote = json.value.value;
      return {
        poolShareBps: Number(extractValue(quote['pool-share-bps']) || 0),
        projectedProfit: Number(extractValue(quote['projected-profit']) || 0) / 1_000_000,
        projectedPayout: Number(extractValue(quote['projected-payout']) || 0) / 1_000_000,
        entryFee: Number(extractValue(quote['entry-fee']) || 0) / 1_000_000,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching shares quote:', error);
    return null;
  }
}

const EVENT_PATTERNS: Record<string, string> = {
  'market-created': 'market-created',
  'bet-placed': 'bet-placed',
  'market-resolved': 'market-resolved',
  'winnings-claimed': 'winnings-claimed',
  'refund-claimed': 'refund-claimed',
};

export async function getContractEvents(limit = 20): Promise<ContractEvent[]> {
  try {
    const apiUrl = NETWORK_ENV === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';
    const contractId = `${config.deployer}.${config.predictionMarket}`;
    const url = `${apiUrl}/extended/v1/contract/${contractId}/events?limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch events: ${response.status}`);

    const data = await response.json();
    const events: ContractEvent[] = [];

    for (const event of data.results || []) {
      if (event.event_type !== 'smart_contract_log') continue;
      try {
        const logData = event.contract_log?.value?.repr;
        if (!logData) continue;

        const matchedType = Object.keys(EVENT_PATTERNS).find(key => logData.includes(key));
        events.push({
          event_type: matchedType ?? 'unknown',
          tx_id: event.tx_id,
          block_height: event.block_height,
          timestamp: new Date(event.block_time_iso || Date.now()).getTime(),
          data: event.contract_log?.value,
        });
      } catch {
        // skip unparseable events
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return [];
  }
}
