/**
 * Cross-Chain Utilities
 *
 * Helper functions for cross-chain operations in ShadowOS
 */

export type SupportedChain = 
  | "ethereum"
  | "polygon"
  | "bsc"
  | "solana"
  | "arbitrum"
  | "optimism"
  | "avalanche";

export interface ChainConfig {
  chainId: string;
  name: string;
  rpcUrl?: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Supported chain configurations
 */
export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    chainId: "1",
    name: "Ethereum Mainnet",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  polygon: {
    chainId: "137",
    name: "Polygon",
    explorerUrl: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  bsc: {
    chainId: "56",
    name: "BNB Smart Chain",
    explorerUrl: "https://bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
  solana: {
    chainId: "solana-mainnet",
    name: "Solana",
    explorerUrl: "https://solscan.io",
    nativeCurrency: {
      name: "SOL",
      symbol: "SOL",
      decimals: 9,
    },
  },
  arbitrum: {
    chainId: "42161",
    name: "Arbitrum One",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  optimism: {
    chainId: "10",
    name: "Optimism",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  avalanche: {
    chainId: "43114",
    name: "Avalanche C-Chain",
    explorerUrl: "https://snowtrace.io",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
  },
};

/**
 * Get chain configuration
 */
export function getChainConfig(chain: SupportedChain): ChainConfig {
  return CHAIN_CONFIGS[chain];
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chain: string): chain is SupportedChain {
  return chain in CHAIN_CONFIGS;
}

/**
 * Get all supported chains
 */
export function getSupportedChains(): SupportedChain[] {
  return Object.keys(CHAIN_CONFIGS) as SupportedChain[];
}

/**
 * Convert amount between chains with different decimals
 */
export function convertAmount(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  if (fromDecimals === toDecimals) {
    return amount;
  }

  if (fromDecimals > toDecimals) {
    const divisor = BigInt(10 ** (fromDecimals - toDecimals));
    return amount / divisor;
  } else {
    const multiplier = BigInt(10 ** (toDecimals - fromDecimals));
    return amount * multiplier;
  }
}

/**
 * Format chain name for display
 */
export function formatChainName(chain: SupportedChain): string {
  return CHAIN_CONFIGS[chain].name;
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(chain: SupportedChain, txHash: string): string {
  const config = CHAIN_CONFIGS[chain];
  if (!config.explorerUrl) {
    return "";
  }
  return `${config.explorerUrl}/tx/${txHash}`;
}

