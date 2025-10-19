"use client";

import React, { useState, useEffect } from 'react';
import { initOnRamp, CBPayInstanceType } from '@coinbase/cbpay-js';
import { Modal } from '../ui/modal';
import { useWallets } from '@privy-io/react-auth';
import { useApi } from '../../context/api-context';
import {
    CurrencyDollarIcon,
    SpinnerIcon,
    AlertTriangleIcon,
    CheckCircleIcon
} from '../ui/icons';

interface OnrampConfigResponse {
    appId: string;
    provider: 'coinbase';
    sessionToken?: string; // For secure initialization
    destinationWallets?: Array<{ // Optional fallback
        address: string;
        blockchains: string[];
        assets: string[];
    }>;
    defaultFiatCurrency?: string;
    defaultAmount?: string;
}

/**
 * Fiat Onramp Modal
 * Allows users to purchase FIL tokens using fiat currency via Coinbase OnRamp
 * Uses secure session token generation via backend
 */
export const FiatOnrampModal = ({
    onClose
}: {
    onClose: () => void;
}) => {
    const { wallets, ready } = useWallets();
    const api = useApi();

    // Get the active wallet address from Privy
    const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
    const address = activeWallet?.address || null;
    const isConnected = ready && !!address;

    const [amount, setAmount] = useState<string>('100');
    const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | null>(null);

    useEffect(() => {
        if (!isConnected) {
            setError('Please connect your wallet first to use the onramp.');
        } else {
            setError(null);
        }
    }, [isConnected]);

    // Clean up Coinbase OnRamp instance on unmount
    useEffect(() => {
        return () => {
            if (onrampInstance) {
                onrampInstance.destroy();
            }
        };
    }, [onrampInstance]);

    /**
     * Initialize Coinbase OnRamp and open the widget
     * Backend provides secure session token
     */
    const handleBuyWithCoinbase = async () => {
        if (!address || !isConnected) {
            setError('Please connect your wallet first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Call backend API to get Coinbase OnRamp configuration with session token
            const response = await api.post<OnrampConfigResponse>('/onramp/coinbase-config', {
                walletAddress: address,
                currencyCode: 'FIL', // Filecoin
                baseCurrencyCode: currency, // USD, EUR, GBP
                baseCurrencyAmount: parseFloat(amount) || 100,
            });

            if (!response.appId) {
                throw new Error('Failed to get Coinbase OnRamp configuration');
            }

            console.log('Received config from backend:', {
                hasSessionToken: !!response.sessionToken,
                appId: response.appId
            });

            // Prepare initialization options
            const initOptions: any = {
                appId: response.appId,
                // Display options
                experienceLoggedIn: 'popup',
                experienceLoggedOut: 'popup',
                closeOnExit: true,
                closeOnSuccess: true,
                // Event handlers
                onSuccess: () => {
                    console.log('Coinbase OnRamp: Purchase successful');
                    setIsLoading(false);
                    onClose();
                },
                onExit: () => {
                    console.log('Coinbase OnRamp: User exited');
                    setIsLoading(false);
                },
                onEvent: (event) => {
                    console.log('Coinbase OnRamp event:', event);
                },
            };

            // Use secure session token if available (recommended)
            if (response.sessionToken) {
                console.log('Using secure session token initialization');
                initOptions.sessionToken = response.sessionToken;
            } else if (response.destinationWallets && response.destinationWallets.length > 0) {
                // Fallback: Use addresses format
                console.warn('No session token provided, using fallback addresses initialization');
                const wallet = response.destinationWallets[0];
                const addressesMap: Record<string, string[]> = {
                    [wallet.address]: wallet.blockchains
                };

                initOptions.widgetParameters = {
                    addresses: addressesMap,
                    assets: wallet.assets || ['FIL'],
                    ...(response.defaultFiatCurrency && {
                        defaultFiatCurrency: response.defaultFiatCurrency,
                    }),
                    ...(response.defaultAmount && {
                        defaultAmount: response.defaultAmount,
                    }),
                };
            } else {
                throw new Error('No session token or destination wallets provided');
            }

            // Initialize Coinbase OnRamp with callback pattern
            initOnRamp(initOptions, (error, instance) => {
                // Callback receives error and instance
                if (error) {
                    console.error('Error initializing Coinbase OnRamp:', error);
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to initialize Coinbase OnRamp. Please try again.'
                    );
                    setIsLoading(false);
                    return;
                }

                if (instance) {
                    setOnrampInstance(instance);
                    // Open the Coinbase OnRamp widget
                    instance.open();
                }
            });

        } catch (err) {
            console.error('Error calling backend API:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to get OnRamp configuration. Please try again.'
            );
            setIsLoading(false);
        }
    };

    return (
        <Modal
            onClose={onClose}
            title="Buy FIL Tokens"
            footer={
                <div className="flex justify-end">
                    <button
                        onClick={handleBuyWithCoinbase}
                        disabled={!isConnected || isLoading || parseFloat(amount) < 10}
                        className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
                    >
                        {isLoading ? (
                            <SpinnerIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                                Continue with Coinbase
                            </>
                        )}
                    </button>
                </div>
            }
            maxWidth="max-w-lg"
        >
            <div className="p-1">
                <div className="space-y-6">
                    {/* Wallet Connection Status */}
                    {!isConnected ? (
                        <div className="flex items-start p-4 text-sm rounded-lg bg-status-warning-bg text-status-warning dark:bg-status-warning-bg-dark ring-1 ring-inset ring-status-warning/20">
                            <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">Wallet not connected.</span>
                                <p className="mt-1">Please connect your wallet to purchase FIL tokens.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start p-4 text-sm rounded-lg bg-status-success-bg text-status-success dark:bg-status-success-bg-dark ring-1 ring-inset ring-status-success/20">
                            <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span className="font-semibold">Wallet connected.</span>
                                <p className="mt-1 font-mono text-xs truncate">{address}</p>
                            </div>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">
                            Amount to spend
                        </label>
                        <div className="relative">
                            <input
                                id="amount"
                                type="number"
                                min="10"
                                max="10000"
                                step="10"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-3 pl-4 pr-20 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                                placeholder="100"
                            />
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 border-l border-border dark:border-border-dark bg-transparent text-sm font-semibold focus:outline-none"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                        <p className="mt-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                            You will receive approximately {(parseFloat(amount) / 4).toFixed(2)} FIL
                            <span className="ml-1 text-text-secondary/60">(rate varies)</span>
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-start p-4 text-sm rounded-lg bg-status-danger-bg text-status-danger dark:bg-status-danger-bg-dark ring-1 ring-inset ring-status-danger/20">
                            <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <div>{error}</div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 text-sm space-y-2">
                        <p className="font-semibold">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 text-text-secondary dark:text-text-dark-secondary">
                            <li>Click "Continue with Coinbase" below</li>
                            <li>Complete payment verification (KYC may be required)</li>
                            <li>Approve payment via credit card or bank transfer</li>
                            <li>FIL tokens will be sent directly to your wallet</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
