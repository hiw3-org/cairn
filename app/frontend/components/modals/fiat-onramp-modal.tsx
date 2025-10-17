"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { useAppContext } from '../../context/app-provider';
import { useApi } from '../../context/api-context';
import {
    CurrencyDollarIcon,
    SpinnerIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    ExternalLinkIcon
} from '../ui/icons';

interface OnrampUrlResponse {
    url: string;
    provider: 'moonpay';
}

/**
 * Fiat Onramp Modal
 * Allows users to purchase FIL tokens using fiat currency (credit card, bank transfer, etc.)
 * Integrates with MoonPay via backend API for secure URL generation
 */
export const FiatOnrampModal = ({
    onClose
}: {
    onClose: () => void;
}) => {
    const { currentUser, isAuthenticated } = useAppContext();
    const api = useApi();

    // Get wallet address from currentUser
    const address = currentUser?.address || null;
    const isConnected = isAuthenticated && !!address;
    const userEmail = currentUser?.email || '';

    const [amount, setAmount] = useState<string>('100');
    const [currency, setCurrency] = useState<'usd' | 'eur' | 'gbp'>('usd');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [onrampUrl, setOnrampUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showIframe, setShowIframe] = useState(false);

    useEffect(() => {
        if (!isConnected) {
            setError('Please connect your wallet first to use the onramp.');
        } else {
            setError(null);
        }
    }, [isConnected]);

    /**
     * Generate onramp URL via backend
     * Backend handles MoonPay signature and secure URL construction
     */
    const handleGenerateOnrampUrl = async () => {
        if (!address || !isConnected) {
            setError('Please connect your wallet first.');
            return;
        }

        setIsLoadingUrl(true);
        setError(null);

        try {
            // Call backend API to generate signed MoonPay URL
            const response = await api.post<OnrampUrlResponse>('/onramp/moonpay-url', {
                walletAddress: address,
                email: userEmail,
                currencyCode: 'fil', // Filecoin
                baseCurrencyCode: currency, // usd, eur, gbp
                baseCurrencyAmount: parseFloat(amount) || 100,
            });

            if (response.url) {
                setOnrampUrl(response.url);
            } else {
                throw new Error('Failed to generate onramp URL');
            }
        } catch (err) {
            console.error('Error generating onramp URL:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to generate onramp URL. Please try again.'
            );
        } finally {
            setIsLoadingUrl(false);
        }
    };

    /**
     * Open onramp URL in new tab
     */
    const handleOpenInNewTab = () => {
        if (onrampUrl) {
            window.open(onrampUrl, '_blank', 'noopener,noreferrer');
            onClose(); // Close modal after opening
        }
    };

    /**
     * Show onramp in iframe
     */
    const handleShowInIframe = () => {
        setShowIframe(true);
    };

    const renderForm = () => (
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
                    <div>
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
                        onChange={(e) => setCurrency(e.target.value as 'usd' | 'eur' | 'gbp')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 border-l border-border dark:border-border-dark bg-transparent text-sm font-semibold focus:outline-none"
                    >
                        <option value="usd">USD</option>
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                    </select>
                </div>
                <p className="mt-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                    You will receive approximately {(parseFloat(amount) / 4).toFixed(2)} FIL
                    <span className="ml-1 text-text-secondary/60">(rate varies)</span>
                </p>
            </div>

            {/* Email Display */}
            {userEmail && (
                <div>
                    <label className="block text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">
                        Email (pre-filled from your account)
                    </label>
                    <div className="p-3 border border-border dark:border-border-dark rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 text-sm">
                        {userEmail}
                    </div>
                </div>
            )}

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
                    <li>Click "Continue to MoonPay" below</li>
                    <li>Complete payment verification (KYC may be required)</li>
                    <li>Approve payment via credit card or bank transfer</li>
                    <li>FIL tokens will be sent directly to your wallet</li>
                </ul>
            </div>
        </div>
    );

    const renderOnrampOptions = () => (
        <div className="space-y-4 py-8">
            <div className="text-center">
                <CheckCircleIcon className="w-16 h-16 text-status-success mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Ready to purchase FIL</h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">
                    Choose how you'd like to complete your purchase
                </p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={handleOpenInNewTab}
                    className="w-full flex items-center justify-between p-4 border border-border dark:border-border-dark rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
                >
                    <div className="flex items-center">
                        <ExternalLinkIcon className="w-5 h-5 mr-3" />
                        <div className="text-left">
                            <p className="font-semibold">Open in new tab</p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                Complete purchase in a separate window
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={handleShowInIframe}
                    className="w-full flex items-center justify-between p-4 border border-border dark:border-border-dark rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
                >
                    <div className="flex items-center">
                        <CurrencyDollarIcon className="w-5 h-5 mr-3" />
                        <div className="text-left">
                            <p className="font-semibold">Continue here</p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                Complete purchase without leaving this page
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderIframe = () => (
        <div className="relative w-full" style={{ height: '600px' }}>
            <iframe
                src={onrampUrl || ''}
                className="w-full h-full rounded-lg border border-border dark:border-border-dark"
                allow="camera; microphone; payment"
                title="MoonPay Onramp"
            />
            <button
                onClick={onClose}
                className="absolute top-2 right-2 bg-background dark:bg-background-dark px-4 py-2 rounded-lg border border-border dark:border-border-dark hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 font-semibold text-sm"
            >
                Close
            </button>
        </div>
    );

    const renderFooter = () => {
        if (showIframe) {
            return null; // No footer in iframe mode
        }

        if (onrampUrl && !showIframe) {
            return (
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => {
                            setOnrampUrl(null);
                            setShowIframe(false);
                        }}
                        className="font-semibold py-2.5 px-6 rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
                    >
                        Back
                    </button>
                </div>
            );
        }

        return (
            <div className="flex justify-end">
                <button
                    onClick={handleGenerateOnrampUrl}
                    disabled={!isConnected || isLoadingUrl || parseFloat(amount) < 10}
                    className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                >
                    {isLoadingUrl ? (
                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                            Continue to MoonPay
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <Modal
            onClose={onClose}
            title="Buy FIL Tokens"
            footer={!showIframe ? renderFooter() : undefined}
            maxWidth={showIframe ? 'max-w-4xl' : 'max-w-lg'}
        >
            <div className="p-1">
                {showIframe ? (
                    renderIframe()
                ) : onrampUrl ? (
                    renderOnrampOptions()
                ) : (
                    renderForm()
                )}
            </div>
        </Modal>
    );
};
