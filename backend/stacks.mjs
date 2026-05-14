import {
  AnchorMode,
  PostConditionMode,
  broadcastTransaction,
  cvToJSON,
  falseCV,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  noneCV,
  someCV,
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

    const response = await broadcastTransaction({ transaction, network });
    if ('error' in response) {
      const detail = response.reason_data?.message ?? JSON.stringify(response.reason_data ?? {});
      throw new Error(`${response.reason ?? response.error}: ${detail}`);
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

    // Deployed contract: get-market returns question, description, ipfs-hash, status (string), etc.
    async getMarket(contractMarketId) {
      const value = await callReadOnly('get-market', [uintCV(contractMarketId)]);
      const rawStatus = extractValue(value.status);
      // Normalise numeric status codes from older contract versions to strings
      const statusMap = { '0': 'active', '1': 'resolved', '2': 'cancelled' };
      const status = typeof rawStatus === 'string' && isNaN(Number(rawStatus))
        ? rawStatus
        : (statusMap[String(rawStatus)] ?? 'active');

      return {
        contractMarketId,
        question: extractValue(value.question) ?? null,
        description: extractValue(value.description) ?? null,
        ipfsHash: extractValue(value['ipfs-hash']) ?? null,
        creator: extractValue(value.creator) ?? null,
        createdAtBlock: Number(extractValue(value['created-at']) ?? 0),
        resolveDateBlock: Number(extractValue(value['resolve-date']) ?? 0),
        yesPoolMicro: Number(extractValue(value['yes-pool']) ?? 0),
        noPoolMicro: Number(extractValue(value['no-pool']) ?? 0),
        totalBets: Number(extractValue(value['total-bets']) ?? 0),
        status,
        winningOutcome: extractValue(value['winning-outcome']),
        resolvedAtBlock: extractValue(value['resolved-at'])
          ? Number(extractValue(value['resolved-at']))
          : null,
      };
    },

    // Deployed contract: create-market(question, description?, resolve-date, ipfs-hash?)
    async createMarket(question, description, resolveBlock, ipfsHash) {
      return signedContractCall('create-market', [
        stringAsciiCV(question.slice(0, 256)),
        description ? someCV(stringAsciiCV(description.slice(0, 512))) : noneCV(),
        uintCV(resolveBlock),
        ipfsHash ? someCV(stringAsciiCV(ipfsHash.slice(0, 64))) : noneCV(),
      ]);
    },

    async resolveMarket(contractMarketId, winningOutcome) {
      return signedContractCall('resolve-market', [
        uintCV(contractMarketId),
        winningOutcome ? trueCV() : falseCV(),
      ]);
    },
  };
}
