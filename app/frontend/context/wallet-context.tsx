/**
 * Wallet Context - Wraps Privy wallet functionality
 * Preserves existing authentication while adding wallet capabilities
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '../hooks/use-privy-wallet';
import { 
  WalletState, 
  WalletActionResult, 
  FilecoinNetwork, 
  FILECOIN_NETWORKS 
} from '../utils/wallet';

// Get Privy App ID from environment (defined in vite.config.ts)
const privyAppId = process.env.REACT_APP_PRIVY_APP_ID;
console.log('Privy App ID loaded:', privyAppId ? 'Found' : 'Missing', privyAppId?.slice(0, 8) + '...');

// Privy configuration for social login + wallet
const PRIVY_CONFIG = {
  appId: privyAppId || 'your-privy-app-id-here',
  config: {
    // Login method options - social + wallet
    loginMethods: [
      'google' as const,
      'twitter' as const, 
      'discord' as const,
      'github' as const,
      'email' as const,
      'sms' as const,
      'wallet' as const, // Keep wallet as backup option
    ],
    // UI customization to match Cairn theme
    appearance: {
      theme: 'dark' as const,
      accentColor: '#6366f1' as `#${string}`, // Cairn brand color
      logo: '/logo.svg', // Your Cairn logo
      showWalletLoginFirst: false, // Show social logins first
    },
    // Embedded wallet configuration for social login users
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets' as const,
      },
    },
    // Legal links
    legal: {
      termsAndConditionsUrl: 'https://cairn.dev/terms',
      privacyPolicyUrl: 'https://cairn.dev/privacy',
    },
  },
};

// Combined authentication and wallet context interface
interface WalletContextType {
  // Authentication state (from Privy)
  isAuthenticated: boolean;
  user: any; // Privy user object
  isPrivyReady: boolean;
  
  // Wallet state
  walletState: WalletState;
  isWalletReady: boolean;
  isNetworkSupported: boolean;
  
  // Authentication actions
  login: () => void;
  logout: () => Promise<void>;
  
  // Wallet actions
  connectExternalWallet: () => Promise<WalletActionResult>;
  createEmbeddedWallet: () => Promise<WalletActionResult>;
  switchNetwork: (network: FilecoinNetwork) => Promise<WalletActionResult>;
  signMessage: (message: string) => Promise<WalletActionResult>;
  getWalletInfo: () => Promise<WalletActionResult>;
  disconnectWallet: () => Promise<WalletActionResult>;
  
  // Helper data
  supportedNetworks: typeof FILECOIN_NETWORKS;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Inner wallet provider that uses Privy hooks
 */
const WalletProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyWallet = usePrivyWallet();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize context when Privy is ready
  useEffect(() => {
    if (ready && privyWallet.isReady && !isInitialized) {
      setIsInitialized(true);
      console.log('🔗 Privy context initialized', { authenticated, hasUser: !!user });
    }
  }, [ready, privyWallet.isReady, isInitialized, authenticated, user]);

  // Log authentication changes
  useEffect(() => {
    if (authenticated && user) {
      console.log('🔐 User authenticated:', {
        id: user.id,
        wallets: user.linkedAccounts?.filter((acc: any) => acc.type === 'wallet')?.length || 0,
        socialAccounts: user.linkedAccounts?.filter((acc: any) => acc.type !== 'wallet')?.length || 0,
      });
    }
  }, [authenticated, user]);

  // Log wallet state changes
  useEffect(() => {
    if (privyWallet.walletState.isConnected) {
      console.log('🔗 Wallet connected:', {
        address: privyWallet.walletState.address,
        network: privyWallet.walletState.network,
        isEmbedded: privyWallet.walletState.isEmbedded,
      });
    }
  }, [privyWallet.walletState]);

  const contextValue: WalletContextType = {
    // Authentication state
    isAuthenticated: authenticated,
    user,
    isPrivyReady: ready,
    
    // Wallet state
    walletState: privyWallet.walletState,
    isWalletReady: privyWallet.isReady && isInitialized,
    isNetworkSupported: privyWallet.isNetworkSupported,
    
    // Authentication actions
    login,
    logout,
    
    // Wallet actions
    connectExternalWallet: privyWallet.connectExternalWallet,
    createEmbeddedWallet: privyWallet.createEmbeddedWallet,
    switchNetwork: privyWallet.switchNetwork,
    signMessage: privyWallet.signMessage,
    getWalletInfo: privyWallet.getWalletInfo,
    disconnectWallet: privyWallet.disconnectWallet,
    
    // Helper data
    supportedNetworks: privyWallet.supportedNetworks,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Main wallet provider that wraps Privy
 */
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PrivyProvider
      appId={PRIVY_CONFIG.appId}
      config={PRIVY_CONFIG.config}
    >
      <WalletProviderInner>
        {children}
      </WalletProviderInner>
    </PrivyProvider>
  );
};

/**
 * Hook to use wallet context
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};

/**
 * Hook to check wallet connection status
 */
export const useWalletConnection = () => {
  const { walletState, isWalletReady } = useWallet();
  
  return {
    isConnected: walletState.isConnected,
    address: walletState.address,
    chainId: walletState.chainId,
    network: walletState.network,
    isEmbedded: walletState.isEmbedded,
    isReady: isWalletReady,
    hasWallet: isWalletReady && walletState.isConnected,
  };
};

/**
 * Wallet action helpers with error handling
 */
export const useWalletActions = () => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const executeWalletAction = async (
    action: () => Promise<WalletActionResult>,
    successMessage?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);

    try {
      const result = await action();
      
      if (result.success) {
        if (successMessage) {
          console.log('✅ Wallet action success:', successMessage);
        }
        return true;
      } else {
        setLastError(result.error || 'Unknown error');
        console.error('❌ Wallet action failed:', result.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      console.error('❌ Wallet action error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    lastError,
    clearError: () => setLastError(null),
    
    // Wrapped actions
    connectExternal: () => executeWalletAction(
      wallet.connectExternalWallet,
      'External wallet connected'
    ),
    createEmbedded: () => executeWalletAction(
      wallet.createEmbeddedWallet,
      'Embedded wallet created'
    ),
    switchToNetwork: (network: FilecoinNetwork) => executeWalletAction(
      () => wallet.switchNetwork(network),
      `Switched to ${network} network`
    ),
    signMsg: (message: string) => executeWalletAction(
      () => wallet.signMessage(message),
      'Message signed'
    ),
    disconnect: () => executeWalletAction(
      wallet.disconnectWallet,
      'Wallet disconnected'
    ),
  };
};

/**
 * Hook for authentication with Privy
 */
export const usePrivyAuth = () => {
  const { isAuthenticated, user, isPrivyReady, login, logout } = useWallet();
  
  return {
    // State
    isAuthenticated,
    user,
    isReady: isPrivyReady,
    
    // Actions  
    login, // Opens Privy's login modal with social options
    logout,
    
    // Helper functions
    getUserInfo: () => user,
    isLoggedIn: () => isAuthenticated && !!user,
  };
};
