/**
 * Wallet utility functions for Privy integration
*/

// Filecoin network configurations
export const FILECOIN_NETWORKS = {
  mainnet: {
    id: 314,
    name: 'Filecoin Mainnet',
    rpcUrl: 'https://api.node.glif.io/rpc/v1',
    blockExplorer: 'https://filfox.info/en',
  },
  calibration: {
    id: 314159,
    name: 'Filecoin Calibration Testnet', 
    rpcUrl: 'https://api.calibration.node.glif.io/rpc/v1',
    blockExplorer: 'https://calibration.filfox.info/en',
  }
} as const;

export type FilecoinNetwork = keyof typeof FILECOIN_NETWORKS;

/**
 * Wallet connection state interface
 */
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isEmbedded: boolean;
  network: FilecoinNetwork | null;
}

/**
 * Wallet action result interface
 */
export interface WalletActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Format wallet address for display
 */
export const formatWalletAddress = (address: string, length = 4): string => {
  if (!address) return '';
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

/**
 * Validate if address is a valid Ethereum/Filecoin address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Basic hex address validation (0x followed by 40 hex characters)
  const ethPattern = /^0x[a-fA-F0-9]{40}$/;
  
  // Filecoin f4 address validation (starts with f4 and is base32)
  const filPattern = /^f4[a-z2-7]{39}$/;
  
  return ethPattern.test(address) || filPattern.test(address);
};

/**
 * Get network info by chain ID
 */
export const getNetworkByChainId = (chainId: number): FilecoinNetwork | null => {
  for (const [key, network] of Object.entries(FILECOIN_NETWORKS)) {
    if (network.id === chainId) {
      return key as FilecoinNetwork;
    }
  }
  return null;
};

/**
 * Check if current network is supported
 */
export const isSupportedNetwork = (chainId: number): boolean => {
  return Object.values(FILECOIN_NETWORKS).some(network => network.id === chainId);
};

/**
 * Get block explorer URL for address
 */
export const getExplorerUrl = (
  address: string, 
  network: FilecoinNetwork = 'calibration'
): string => {
  const baseUrl = FILECOIN_NETWORKS[network].blockExplorer;
  return `${baseUrl}/address/${address}`;
};





/**
 * Wallet error types for better error handling
 */
export enum WalletError {
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR', 
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Parse wallet error and return user-friendly message
 */
export const parseWalletError = (error: any): { type: WalletError; message: string } => {
  if (!error) {
    return { type: WalletError.UNKNOWN_ERROR, message: 'Unknown error occurred' };
  }

  const errorMessage = error.message || error.toString().toLowerCase();

  if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    return { type: WalletError.USER_REJECTED, message: 'Wallet connection was rejected by user' };
  }

  if (errorMessage.includes('network') || errorMessage.includes('chain')) {
    return { type: WalletError.NETWORK_ERROR, message: 'Network connection error' };
  }

  if (errorMessage.includes('connection') || errorMessage.includes('failed to connect')) {
    return { type: WalletError.CONNECTION_FAILED, message: 'Failed to connect wallet' };
  }

  return { 
    type: WalletError.UNKNOWN_ERROR, 
    message: 'Wallet operation failed. Please try again.' 
  };
};

/**
 * Retry utility for wallet operations
 */
export const retryWalletOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

/**
 * Storage keys for persisting wallet preferences
 */
export const WALLET_STORAGE_KEYS = {
  LAST_CONNECTED_WALLET: 'cairn_last_wallet',
  PREFERRED_NETWORK: 'cairn_preferred_network', 
  WALLET_CONNECT_TIMESTAMP: 'cairn_wallet_connect_time'
} as const;

/**
 * Save wallet preference to localStorage
 */
export const saveWalletPreference = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save wallet preference:', error);
  }
};

/**
 * Get wallet preference from localStorage  
 */
export const getWalletPreference = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get wallet preference:', error);
    return null;
  }
};

/**
 * Clear all wallet preferences
 */
export const clearWalletPreferences = (): void => {
  try {
    Object.values(WALLET_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear wallet preferences:', error);
  }
};
