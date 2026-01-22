# PredictStack - Frontend Integration Guide

## Overview

This guide explains how to integrate the PredictStack prediction market contracts with a frontend application.

---

## Contract Interaction

### Dependencies

```bash
npm install @stacks/connect @stacks/transactions @stacks/network
```

---

## Configuration

```typescript
// config.ts
import { StacksMainnet, StacksTestnet, StacksDevnet } from '@stacks/network';

// Contract addresses (update after deployment)
export const CONTRACTS = {
  devnet: {
    predictionMarket: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.prediction-market',
    usdcx: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.mock-usdcx',
  },
  testnet: {
    predictionMarket: 'ST...xxx.prediction-market',
    usdcx: 'ST...xxx.token-usdcx',
  },
  mainnet: {
    predictionMarket: 'SP...xxx.prediction-market',
    usdcx: 'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-usdcx', // Actual USDCx
  },
};

export const getNetwork = (env: 'devnet' | 'testnet' | 'mainnet') => {
  switch (env) {
    case 'mainnet':
      return new StacksMainnet();
    case 'testnet':
      return new StacksTestnet();
    default:
      return new StacksDevnet();
  }
};
```

---

## Read-Only Functions

### Get Market Details

```typescript
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';

async function getMarket(marketId: number) {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'get-market',
    functionArgs: [uintCV(marketId)],
    network: getNetwork('devnet'),
    senderAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  });
  
  return cvToJSON(result);
}
```

### Get Current Odds

```typescript
async function getCurrentOdds(marketId: number) {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'get-current-odds',
    functionArgs: [uintCV(marketId)],
    network: getNetwork('devnet'),
    senderAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  });
  
  const data = cvToJSON(result);
  
  // Calculate percentage odds
  const yesOdds = (data.value['yes-odds-numerator'].value / 
                   data.value['yes-odds-denominator'].value);
  const noOdds = (data.value['no-odds-numerator'].value / 
                  data.value['no-odds-denominator'].value);
  
  return { yesOdds, noOdds };
}
```

### Calculate Potential Payout

```typescript
async function calculatePayout(marketId: number, outcome: boolean, amount: number) {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'calculate-potential-payout',
    functionArgs: [
      uintCV(marketId),
      boolCV(outcome),
      uintCV(amount),
    ],
    network: getNetwork('devnet'),
    senderAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  });
  
  return cvToJSON(result);
}
```

### Get User Position

```typescript
async function getUserPosition(user: string, marketId: number) {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'get-user-position',
    functionArgs: [
      standardPrincipalCV(user),
      uintCV(marketId),
    ],
    network: getNetwork('devnet'),
    senderAddress: user,
  });
  
  return cvToJSON(result);
}
```

### Get Platform Stats

```typescript
async function getPlatformStats() {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'get-platform-stats',
    functionArgs: [],
    network: getNetwork('devnet'),
    senderAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  });
  
  return cvToJSON(result);
}
```

---

## Public Functions (Transactions)

### Place a Bet

```typescript
import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  boolCV, 
  contractPrincipalCV,
  PostConditionMode,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo,
} from '@stacks/transactions';

async function placeBet(marketId: number, outcome: boolean, amount: number) {
  const network = getNetwork('devnet');
  
  // Create post-condition to ensure user only sends the expected amount
  const postCondition = makeStandardFungiblePostCondition(
    userAddress,
    FungibleConditionCode.Equal,
    BigInt(amount),
    createAssetInfo(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'mock-usdcx',
      'mock-usdcx' // Asset name
    )
  );

  await openContractCall({
    network,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'place-bet',
    functionArgs: [
      uintCV(marketId),
      boolCV(outcome),
      uintCV(amount),
      contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mock-usdcx'),
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [postCondition],
    onFinish: (data) => {
      console.log('Transaction submitted:', data.txId);
      // Track transaction status
    },
    onCancel: () => {
      console.log('Transaction cancelled by user');
    },
  });
}
```

### Claim Winnings

```typescript
async function claimWinnings(marketId: number) {
  const network = getNetwork('devnet');

  await openContractCall({
    network,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'claim-winnings',
    functionArgs: [
      uintCV(marketId),
      contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mock-usdcx'),
    ],
    postConditionMode: PostConditionMode.Allow, // Allow contract to send tokens
    onFinish: (data) => {
      console.log('Claim submitted:', data.txId);
    },
    onCancel: () => {
      console.log('Claim cancelled');
    },
  });
}
```

### Claim Refund (Cancelled Markets)

```typescript
async function claimRefund(marketId: number) {
  const network = getNetwork('devnet');

  await openContractCall({
    network,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'claim-refund',
    functionArgs: [
      uintCV(marketId),
      contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mock-usdcx'),
    ],
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('Refund submitted:', data.txId);
    },
  });
}
```

---

## Admin Functions

### Create a Market (Admin Only)

```typescript
async function createMarket(
  question: string, 
  description: string | null, 
  resolveDate: number
) {
  const network = getNetwork('devnet');

  await openContractCall({
    network,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'create-market',
    functionArgs: [
      stringAsciiCV(question),
      description ? someCV(stringAsciiCV(description)) : noneCV(),
      uintCV(resolveDate),
      contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mock-usdcx'),
    ],
    onFinish: (data) => {
      console.log('Market created:', data.txId);
    },
  });
}
```

### Resolve a Market (Oracle Only)

```typescript
async function resolveMarket(marketId: number, winningOutcome: boolean) {
  const network = getNetwork('devnet');

  await openContractCall({
    network,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'prediction-market',
    functionName: 'resolve-market',
    functionArgs: [
      uintCV(marketId),
      boolCV(winningOutcome),
      contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mock-usdcx'),
    ],
    onFinish: (data) => {
      console.log('Market resolved:', data.txId);
    },
  });
}
```

---

## Listening for Events

### Using Stacks API

```typescript
import { TransactionsApi, Configuration } from '@stacks/blockchain-api-client';

const config = new Configuration({
  basePath: 'https://api.testnet.hiro.so',
});

const txApi = new TransactionsApi(config);

// Poll for transaction events
async function getMarketEvents(contractAddress: string) {
  const response = await txApi.getTransactionsByBlockHeight({
    height: blockHeight,
  });
  
  // Filter for prediction-market contract calls
  const marketEvents = response.results.filter(tx => 
    tx.contract_call?.contract_id === contractAddress
  );
  
  return marketEvents;
}
```

### Parsing Print Events

The contract emits print events for key actions:

```typescript
interface MarketCreatedEvent {
  event: 'market-created';
  'market-id': number;
  question: string;
  creator: string;
  'resolve-date': number;
  'block-height': number;
}

interface BetPlacedEvent {
  event: 'bet-placed';
  'market-id': number;
  user: string;
  outcome: boolean;
  amount: number;
  'new-yes-pool': number;
  'new-no-pool': number;
  'block-height': number;
}

interface MarketResolvedEvent {
  event: 'market-resolved';
  'market-id': number;
  'winning-outcome': boolean;
  'yes-pool': number;
  'no-pool': number;
  'resolved-by': string;
  'block-height': number;
}

interface WinningsClaimedEvent {
  event: 'winnings-claimed';
  'market-id': number;
  user: string;
  'winning-stake': number;
  'profit-share': number;
  'platform-fee': number;
  'net-winnings': number;
  'total-payout': number;
  'block-height': number;
}
```

---

## React Hooks Example

```typescript
// hooks/usePredictionMarket.ts
import { useState, useCallback } from 'react';
import { useConnect } from '@stacks/connect-react';

export function usePredictionMarket() {
  const { doContractCall } = useConnect();
  const [loading, setLoading] = useState(false);

  const placeBet = useCallback(async (
    marketId: number,
    outcome: boolean,
    amount: number
  ) => {
    setLoading(true);
    try {
      await doContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'prediction-market',
        functionName: 'place-bet',
        functionArgs: [
          uintCV(marketId),
          boolCV(outcome),
          uintCV(amount),
          contractPrincipalCV(CONTRACT_ADDRESS, 'mock-usdcx'),
        ],
        onFinish: () => setLoading(false),
        onCancel: () => setLoading(false),
      });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [doContractCall]);

  return { placeBet, loading };
}
```

---

## UI Component Example

```tsx
// components/BetForm.tsx
import React, { useState, useEffect } from 'react';
import { usePredictionMarket } from '../hooks/usePredictionMarket';

interface BetFormProps {
  marketId: number;
}

export function BetForm({ marketId }: BetFormProps) {
  const [outcome, setOutcome] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [potentialPayout, setPotentialPayout] = useState<number>(0);
  const { placeBet, loading } = usePredictionMarket();

  // Calculate potential payout on amount change
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculatePayout(marketId, outcome, parseFloat(amount) * 1_000_000)
        .then(result => {
          setPotentialPayout(result.value['potential-payout'].value / 1_000_000);
        });
    }
  }, [amount, outcome, marketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await placeBet(marketId, outcome, parseFloat(amount) * 1_000_000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <button
          type="button"
          onClick={() => setOutcome(true)}
          className={outcome ? 'active' : ''}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setOutcome(false)}
          className={!outcome ? 'active' : ''}
        >
          NO
        </button>
      </div>
      
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (USDCx)"
        min="1"
        step="0.01"
      />
      
      <div>
        Potential Payout: {potentialPayout.toFixed(2)} USDCx
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Placing Bet...' : 'Place Bet'}
      </button>
    </form>
  );
}
```

---

## Error Handling

```typescript
const ERROR_MESSAGES: Record<number, string> = {
  100: 'Not authorized to perform this action',
  101: 'Market not found',
  102: 'Market has already been resolved',
  103: 'Market has not been resolved yet',
  105: 'Insufficient token balance',
  106: 'Winnings already claimed',
  107: 'No position in this market',
  108: 'Your bet was on the losing side',
  109: 'Platform is currently paused',
  110: 'Invalid bet amount',
  111: 'Betting deadline has passed',
  114: 'Market is not cancelled',
  115: 'Contract already initialized',
};

function getErrorMessage(errorCode: number): string {
  return ERROR_MESSAGES[errorCode] || `Unknown error: ${errorCode}`;
}
```

---

## Best Practices

1. **Always use post-conditions** for token transfers to protect users
2. **Cache market data** to reduce API calls
3. **Show real-time odds updates** by polling or using websockets
4. **Display clear error messages** using the error codes mapping
5. **Implement loading states** for all transactions
6. **Use optimistic updates** for better UX, then confirm with blockchain
7. **Handle transaction timeouts** and provide retry options
