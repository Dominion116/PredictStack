import {
  AnchorMode,
  PostConditionMode,
  broadcastTransaction,
  cvToJSON,
  falseCV,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  stringAsciiCV,
  trueCV,
  uintCV,
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET, createNetwork } from '@stacks/network';

function extractValue(clarityValue) {
  if (clarityValue === null || clarityValue === undefined) return null;
  if (typeof clarityValue !== 'object') return clarityValue;
  if ('type' in clarityValue && 'value' in clarityValue) {
    if (clarityValue.type === 'none') return null;
    return extractValue(clarityValue.value);
  }
  return clarityValue;
}

export function createStacksClient(config) {
  const network = createNetwork(config.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

  async function callReadOnly(functionName, functionArgs = [], senderAddress = config.contractAddress) {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.contractAddress,
      contractName: config.contractName,
      functionName,
      functionArgs,
      senderAddress,
      network,
    });

    const json = cvToJSON(response);
    if (!json.success) {
      throw new Error(`Read-only call failed for ${functionName}`);
    }
    return json.value?.value ?? json.value;
  }

  async function signedContractCall(functionName, functionArgs) {
    const transaction = await makeContractCall({
      contractAddress: config.contractAddress,
      contractName: config.contractName,
      functionName,
      functionArgs,
      senderKey: config.privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      validateWithAbi: false,
    });

    const response = await broadcastTransaction(transaction, network);
    if ('error' in response) {
      throw new Error(response.reason ?? response.error ?? 'Failed to broadcast transaction');
    }
    return response.txid;
  }

  return {
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    networkName: config.network,
    signerAddress: getAddressFromPrivateKey(config.privateKey, config.network === 'mainnet' ? 'mainnet' : 'testnet'),
    async getNextMarketId() {
      const value = await callReadOnly('get-next-market-id');
      return Number(extractValue(value) ?? 0);
    },
    async getPlatformStats() {
      const value = await callReadOnly('get-platform-stats');
      return {
        totalMarkets: Number(extractValue(value['total-markets']) ?? 0),
        totalVolume: Number(extractValue(value['total-volume']) ?? 0),
        totalFeesCollected: Number(extractValue(value['total-fees-collected']) ?? 0),
      };
    },
    async getMarket(contractMarketId) {
      const value = await callReadOnly('get-market', [uintCV(contractMarketId)]);
      return {
        contractMarketId,
        marketRef: extractValue(value['market-ref']) ?? null,
        creator: extractValue(value.creator) ?? null,
        createdAtBlock: Number(extractValue(value['created-at']) ?? 0),
        resolveDateBlock: Number(extractValue(value['resolve-date']) ?? 0),
        yesPoolMicro: Number(extractValue(value['yes-pool']) ?? 0),
        noPoolMicro: Number(extractValue(value['no-pool']) ?? 0),
        totalBets: Number(extractValue(value['total-bets']) ?? 0),
        status: extractValue(value.status) ?? 'active',
        winningOutcome: extractValue(value['winning-outcome']),
        resolvedAtBlock: extractValue(value['resolved-at']) ? Number(extractValue(value['resolved-at'])) : null,
      };
    },
    async createMarket(marketRef, resolveBlock) {
      return signedContractCall('create-market', [stringAsciiCV(marketRef), uintCV(resolveBlock)]);
    },
    async resolveMarket(contractMarketId, winningOutcome) {
      return signedContractCall('resolve-market', [
        uintCV(contractMarketId),
        winningOutcome ? trueCV() : falseCV(),
      ]);
    },
  };
}
