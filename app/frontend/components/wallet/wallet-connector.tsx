/**
 * Wallet Connection Component
 * Demonstrates how to use Privy wallet helpers in Cairn app
 */

import React from 'react';
import { useWallet, useWalletConnection, useWalletActions } from '../../context/wallet-context';
import { formatWalletAddress, getExplorerUrl, FilecoinNetwork } from '../../utils/wallet';
import { WalletIcon, CheckCircleIcon, AlertTriangleIcon } from '../ui/icons';

interface WalletConnectorProps {
  className?: string;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ className = '' }) => {
  const { isConnected, address, network, isEmbedded, isReady } = useWalletConnection();
  const { supportedNetworks } = useWallet();
  const { 
    connectExternal, 
    createEmbedded, 
    switchToNetwork, 
    disconnect,
    isLoading, 
    lastError,
    clearError 
  } = useWalletActions();

  if (!isReady) {
    return (
      <div className={`p-4 rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Initializing wallet...
          </span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <WalletIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Connect Wallet
            </h3>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={connectExternal}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WalletIcon className="w-4 h-4" />
                  <span>Connect External Wallet</span>
                </>
              )}
            </button>
            
            <button
              onClick={createEmbedded}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <WalletIcon className="w-4 h-4" />
                  <span>Create Embedded Wallet</span>
                </>
              )}
            </button>
          </div>

          {lastError && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{lastError}</p>
                <button
                  onClick={clearError}
                  className="mt-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Wallet Connected
            </h3>
          </div>
          <button
            onClick={disconnect}
            disabled={isLoading}
            className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Address:</span>
            <a
              href={address ? getExplorerUrl(address, network || 'calibration') : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              {address ? formatWalletAddress(address) : 'Unknown'}
            </a>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Network:</span>
            <span className="text-gray-900 dark:text-white capitalize">
              {network || 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <span className="text-gray-900 dark:text-white">
              {isEmbedded ? 'Embedded' : 'External'}
            </span>
          </div>
        </div>

        {/* Network switcher */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Switch Network:
          </label>
          <div className="flex space-x-2">
            {Object.entries(supportedNetworks).map(([key, networkInfo]) => (
              <button
                key={key}
                onClick={() => switchToNetwork(key as FilecoinNetwork)}
                disabled={isLoading || network === key}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  network === key
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {(networkInfo as any).name.replace('Filecoin ', '')}
              </button>
            ))}
          </div>
        </div>

        {lastError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{lastError}</p>
              <button
                onClick={clearError}
                className="mt-1 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
