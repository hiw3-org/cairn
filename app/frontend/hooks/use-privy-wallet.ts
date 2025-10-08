/**
 * Privy wallet helper functions
 * Provides wallet-only functionality while preserving existing authentication
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import {
  FILECOIN_NETWORKS,
  FilecoinNetwork,
  WalletState,
  WalletActionResult,
  parseWalletError,
  retryWalletOperation,
  isSupportedNetwork,
  getNetworkByChainId,
  saveWalletPreference,
  WALLET_STORAGE_KEYS
} from '../utils/wallet';

/**
 * Custom hook for Privy wallet functionality
 */
export const usePrivyWallet = () => {
  const { ready, connectWallet, createWallet } = usePrivy();
  const { wallets } = useWallets();

  // Get primary wallet (first connected wallet)
  const primaryWallet = wallets.length > 0 ? wallets[0] : null;

  /**
   * Current wallet state
   */
  const walletState: WalletState = useMemo(() => {
    if (!primaryWallet) {
      return {
        address: null,
        chainId: null,
        isConnected: false,
        isEmbedded: false,
        network: null
      };
    }

    const chainId = primaryWallet.chainId ? parseInt(primaryWallet.chainId) : null;
    
    return {
      address: primaryWallet.address,
      chainId,
      isConnected: true,
      isEmbedded: primaryWallet.walletClientType === 'privy',
      network: chainId ? getNetworkByChainId(chainId) : null
    };
  }, [primaryWallet]);

  /**
   * Connect external wallet (MetaMask, etc.)
   */
  const connectExternalWallet = useCallback(async (): Promise<WalletActionResult> => {
    if (!ready) {
      return { success: false, error: 'Privy not ready' };
    }

    try {
      await connectWallet();
      saveWalletPreference(WALLET_STORAGE_KEYS.LAST_CONNECTED_WALLET, 'external');
      saveWalletPreference(WALLET_STORAGE_KEYS.WALLET_CONNECT_TIMESTAMP, Date.now().toString());
      
      return { success: true };
    } catch (error) {
      const { message } = parseWalletError(error);
      return { success: false, error: message };
    }
  }, [ready, connectWallet]);

  /**
   * Create embedded Privy wallet
   */
  const createEmbeddedWallet = useCallback(async (): Promise<WalletActionResult> => {
    if (!ready) {
      return { success: false, error: 'Privy not ready' };
    }

    try {
      await createWallet();
      saveWalletPreference(WALLET_STORAGE_KEYS.LAST_CONNECTED_WALLET, 'embedded');
      saveWalletPreference(WALLET_STORAGE_KEYS.WALLET_CONNECT_TIMESTAMP, Date.now().toString());
      
      return { success: true };
    } catch (error) {
      const { message } = parseWalletError(error);
      return { success: false, error: message };
    }
  }, [ready, createWallet]);

  /**
   * Switch to specific Filecoin network
   */
  const switchNetwork = useCallback(async (network: FilecoinNetwork): Promise<WalletActionResult> => {
    if (!primaryWallet) {
      return { success: false, error: 'No wallet connected' };
    }

    const targetNetwork = FILECOIN_NETWORKS[network];
    
    try {
      await retryWalletOperation(async () => {
        await primaryWallet.switchChain(targetNetwork.id);
      });

      saveWalletPreference(WALLET_STORAGE_KEYS.PREFERRED_NETWORK, network);
      
      return { success: true, data: { network, chainId: targetNetwork.id } };
    } catch (error) {
      const { message } = parseWalletError(error);
      return { success: false, error: message };
    }
  }, [primaryWallet]);



  /**
   * Sign message with wallet
   */
  const signMessage = useCallback(async (message: string): Promise<WalletActionResult> => {
    if (!primaryWallet) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      const signature = await retryWalletOperation(async () => {
        return await primaryWallet.sign(message);
      });

      return { success: true, data: { signature, message } };
    } catch (error) {
      const { message: errorMsg } = parseWalletError(error);
      return { success: false, error: errorMsg };
    }
  }, [primaryWallet]);

  /**
   * Check if current network is supported
   */
  const isNetworkSupported = useMemo(() => {
    return walletState.chainId ? isSupportedNetwork(walletState.chainId) : false;
  }, [walletState.chainId]);

  /**
   * Get wallet balance (simplified - just returns address info)
   */
  const getWalletInfo = useCallback(async (): Promise<WalletActionResult> => {
    if (!primaryWallet) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      return { 
        success: true, 
        data: { 
          address: primaryWallet.address,
          chainId: primaryWallet.chainId,
          walletClientType: primaryWallet.walletClientType
        } 
      };
    } catch (error) {
      const { message } = parseWalletError(error);
      return { success: false, error: message };
    }
  }, [primaryWallet]);

  /**
   * Disconnect wallet (removes from Privy)
   */
  const disconnectWallet = useCallback(async (): Promise<WalletActionResult> => {
    if (!primaryWallet) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      // Note: Privy handles wallet disconnection through user action
      // We can't programmatically force disconnect, but we can clear preferences
      saveWalletPreference(WALLET_STORAGE_KEYS.LAST_CONNECTED_WALLET, '');
      
      return { success: true };
    } catch (error) {
      const { message } = parseWalletError(error);
      return { success: false, error: message };
    }
  }, [primaryWallet]);

  return {
    // State
    walletState,
    isReady: ready,
    isNetworkSupported,
    wallets,
    primaryWallet,

    // Connection actions  
    connectExternalWallet,
    createEmbeddedWallet,
    disconnectWallet,

    // Network actions
    switchNetwork,

    // Utility actions
    signMessage,
    getWalletInfo,

    // Helper data
    supportedNetworks: FILECOIN_NETWORKS
  };
};
