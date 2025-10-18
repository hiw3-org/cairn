"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { useAppContext } from '../../context/app-provider';
import { useApi } from '../../context/api-context';
import type { Project } from '../../lib/types';
import {
    CurrencyDollarIcon,
    SpinnerIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    DatabaseIcon
} from '../ui/icons';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

interface StorageTier {
    days: number;
    label: string;
    cost: {
        perDay: string;
        totalCost: string;
        costWithBuffer: string;
        dataSizeMB: string;
        dataSizeGB: string;
    };
}

interface StoragePaymentModalProps {
    project: Project;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * Storage Payment Modal
 * Allows users to pay for Filecoin storage and PoR generation
 * Features:
 * - Real-time cost calculation
 * - Multiple storage duration options
 * - Payment via USDFC tokens
 * - Integration with Synapse/Filecoin
 */
export const StoragePaymentModal = ({
    project,
    onClose,
    onSuccess
}: StoragePaymentModalProps) => {
    const { currentUser, addToast } = useAppContext();
    const api = useApi();
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const [step, setStep] = useState<'calculate' | 'payment' | 'uploading' | 'success'>('calculate');
    const [selectedDuration, setSelectedDuration] = useState(90); // default 90 days
    const [pricingTiers, setPricingTiers] = useState<StorageTier[]>([]);
    const [isLoadingPricing, setIsLoadingPricing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [paymentProgress, setPaymentProgress] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [estimatedSize, setEstimatedSize] = useState(100 * 1024 * 1024); // 100 MB default

    // Wallet address - Privy embedded wallet
    const walletAddress = currentUser?.address;
    // For Privy, we just need a wallet address and ready state
    const isWalletConnected = !!walletAddress && ready;

    // Debug logging
    useEffect(() => {
        console.log('Wallet debug:', {
            walletAddress,
            ready,
            authenticated,
            walletsCount: wallets.length,
            isWalletConnected,
            currentUser
        });
    }, [walletAddress, ready, authenticated, wallets.length, isWalletConnected]);

    /**
     * Fetch pricing tiers on mount
     */
    useEffect(() => {
        if (isWalletConnected) {
            fetchPricingTiers();
        }
    }, [estimatedSize]);

    const fetchPricingTiers = async () => {
        setIsLoadingPricing(true);
        setError(null);

        try {
            const response = await api.post('/storage/pricing-tiers', {
                dataSizeBytes: estimatedSize,
            });

            setPricingTiers(response.pricingTiers);
        } catch (err) {
            console.error('Error fetching pricing:', err);
            setError('Failed to load pricing information');
        } finally {
            setIsLoadingPricing(false);
        }
    };

    const selectedTier = pricingTiers.find(tier => tier.days === selectedDuration);

    /**
     * Process payment with Synapse SDK
     * @param synapse - Synapse SDK instance
     * @param signer - Ethers signer
     */
    const processPayment = async (synapse: any, signer: any) => {
        if (!selectedTier) return;

        console.log('🔵 ===== STARTING PAYMENT PROCESS =====');

        // Calculate required amount (cost + 20% buffer)
        // IMPORTANT: Minimum 0.1 USDFC required for uploads
        const calculatedAmount = ethers.parseUnits(selectedTier.cost.costWithBuffer, 18);
        const minRequired = ethers.parseUnits('0.1', 18);
        const requiredAmount = calculatedAmount > minRequired ? calculatedAmount : minRequired;

        setPaymentProgress('Checking network and balance...');

        try {
            // Check network
            const network = await signer.provider.getNetwork();

            if (network.chainId !== 314159n) {
                throw new Error(`Wrong network. Please switch to Filecoin Calibration testnet (chain ID: 314159). Currently on: ${network.chainId}`);
            }

            // Check wallet USDFC balance (not deposited balance)
            const { TOKENS } = await import('@filoz/synapse-sdk');
            const walletBalance = await synapse.payments.walletBalance(TOKENS.USDFC);

            if (walletBalance < requiredAmount) {
                const shortfall = ethers.formatUnits(requiredAmount - walletBalance, 18);
                throw new Error(
                    `Insufficient USDFC in wallet. You need ${ethers.formatUnits(requiredAmount, 18)} USDFC but only have ${ethers.formatUnits(walletBalance, 18)} USDFC. ` +
                    `Please get more testnet USDFC tokens from the faucet. Shortfall: ${shortfall} USDFC`
                );
            }

            // Check if already deposited enough
            const depositedBalance = await synapse.payments.balance();
            console.log('🏦 Already deposited:', ethers.formatUnits(depositedBalance, 18) + ' USDFC');

            if (depositedBalance >= requiredAmount) {
                console.log('✅ Sufficient funds already deposited, skipping deposit');
                setPaymentProgress('Sufficient funds already deposited');
                // Skip to service approval
            }
        } catch (err: any) {
            console.error('❌ Balance/network check error:', err);
            throw err;
        }

        // Only approve and deposit if we don't have enough deposited
        const depositedBalance = await synapse.payments.balance();
        if (depositedBalance < requiredAmount) {
            console.log('📤 Need to deposit:', ethers.formatUnits(requiredAmount - depositedBalance, 18) + ' USDFC');

            setPaymentProgress('Checking allowances...');

            // Get Payments contract address
            const paymentsAddress = await synapse.getPaymentsAddress();
            let currentAllowance;
            try {
                // Check current allowance
                currentAllowance = await synapse.payments.allowance(paymentsAddress);
            } catch (err: any) {
                console.error('❌ Allowance check error:', err);
                throw new Error('Failed to check token allowance. Please ensure you are on Filecoin Calibration testnet and have USDFC tokens.');
            }

            // Approve USDFC if needed
            if (currentAllowance < requiredAmount) {
                setPaymentProgress('Requesting USDFC approval...');
                addToast('Please approve USDFC spending in your wallet', 'info');

                const approveTx = await synapse.payments.approve(paymentsAddress, requiredAmount);

                setPaymentProgress('Waiting for approval confirmation...');
                const approveReceipt = await approveTx.wait();

                addToast('USDFC approved successfully', 'success');
            } else {
                console.log('✅ Sufficient allowance already exists');
            }

            // Deposit USDFC to Synapse Payments
            console.log('💸 Depositing', ethers.formatUnits(requiredAmount, 18) + ' USDFC to Synapse Payments');
            setPaymentProgress('Depositing USDFC...');
            addToast('Please confirm deposit in your wallet', 'info');

            const depositTx = await synapse.payments.deposit(requiredAmount);

            setPaymentProgress('Waiting for deposit confirmation...');
            await depositTx.wait();

            addToast('Deposit successful', 'success');
        } else {
            console.log('✅ Skipping deposit - sufficient funds already deposited');
        }

        // Get Warm Storage service address
        setPaymentProgress('Setting up storage service...');
        const warmStorageAddress = await synapse.getWarmStorageAddress();

        // Calculate service approval parameters based on actual cost
        // IMPORTANT: Minimum 0.1 USDFC required for Warm Storage service
        const perDayCost = ethers.parseUnits(selectedTier.cost.perDay, 18);
        const rateAllowance = perDayCost * 10n; // 10 days worth as rate allowance
        const minLockup = ethers.parseUnits('0.1', 18); // Minimum 0.1 USDFC
        const lockupAllowance = requiredAmount > minLockup ? requiredAmount : minLockup;
        const maxLockupPeriod = BigInt(selectedDuration * 24 * 60 * 60); // Duration in seconds

        // Approve Warm Storage service
        console.log('🔐 Requesting Warm Storage service approval...');
        setPaymentProgress('Requesting service approval...');
        addToast('Please approve Warm Storage service', 'info');

        const serviceApproveTx = await synapse.payments.approveService(
            warmStorageAddress,
            rateAllowance,
            lockupAllowance,
            maxLockupPeriod
        );

        setPaymentProgress('Waiting for service approval...');
        const serviceReceipt = await serviceApproveTx.wait();

        addToast('Storage service approved', 'success');

        // Payment complete
        setPaymentProgress('Payment complete!');
        console.log('✅ ===== PAYMENT PROCESS COMPLETE =====');

        // Clean up provider if needed
        const ethProvider = synapse.getProvider();
        if (ethProvider && typeof ethProvider.destroy === 'function') {
            await ethProvider.destroy();
        }

        // Proceed to upload
        console.log('🚀 Proceeding to upload...');
        setTimeout(() => {
            handleUpload(serviceApproveTx.hash);
        }, 1000);
    };

    /**
     * Handle payment initiation with Synapse SDK
     * Sets up USDFC payments and approves Warm Storage service
     */
    const handlePayment = async () => {
        if (!selectedTier) {
            setError('Please select a storage duration');
            return;
        }

        if (!isWalletConnected) {
            setError('Please connect your wallet first');
            return;
        }

        setStep('payment');
        setError(null);
        setPaymentProgress('Initializing payment...');

        try {

            // Try to get the embedded wallet from Privy
            let wallet;

            if (wallets.length === 0) {
                // No wallets found - user needs to connect via Privy first
                throw new Error('No wallets found. Please try refreshing the page or reconnecting your wallet.');
            }

            wallet = wallets[0];

            setPaymentProgress('Getting wallet provider...');

            // For Privy embedded wallets, we need to get the provider differently
            let provider;
            let signer;

            if (wallet.walletClientType === 'privy') {

                // Privy wallets expose a provider property
                const privyProvider = await wallet.getEthereumProvider();

                if (!privyProvider) {
                    throw new Error('Could not get Privy wallet provider');
                }

                provider = new ethers.BrowserProvider(privyProvider);

                setPaymentProgress('Getting signer...');
                signer = await provider.getSigner();
                const address = await signer.getAddress();
                console.log('Connected to address:', address);
            } else {
                // External wallet (MetaMask, etc.)
                provider = await wallet.getEthersProvider();
                signer = await provider.getSigner();
            }

            setPaymentProgress('Switching to Filecoin network...');
            // Switch to Filecoin Calibration testnet
            try {
                await provider.send("wallet_switchEthereumChain", [{ chainId: '0x4cb2f' }]); // 314159 in hex
            } catch (switchError: any) {
                // Chain doesn't exist, need to add it
                if (switchError.code === 4902) {
                    await provider.send("wallet_addEthereumChain", [{
                        chainId: '0x4cb2f',
                        chainName: 'Filecoin Calibration',
                        nativeCurrency: { name: 'tFIL', symbol: 'tFIL', decimals: 18 },
                        rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
                        blockExplorerUrls: ['https://calibration.filfox.info/en']
                    }]);
                } else {
                    throw switchError;
                }
            }

            setPaymentProgress('Connecting to Synapse...');

            // Dynamically import Synapse SDK (ES Module)
            const { Synapse } = await import('@filoz/synapse-sdk');

            // Initialize Synapse with user's wallet
            const synapse = await Synapse.create({ provider });

            // Process payment
            await processPayment(synapse, signer);

        } catch (err: any) {
            console.error('Payment error:', err);

            let errorMessage = 'Payment failed';
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                errorMessage = 'Transaction rejected by user';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setStep('calculate');
            addToast(errorMessage, 'error');
        }
    };

    /**
     * Handle upload to Filecoin using user's wallet
     * @param paymentTxHash - Transaction hash from payment deposit
     */
    const handleUpload = async (paymentTxHash?: string) => {
        console.log('🔵 ===== STARTING UPLOAD PROCESS =====');
        if (!project.huggingface?.repository_url) {
            setError('Project does not have a HuggingFace repository');
            return;
        }

        setStep('uploading');
        setError(null);
        setUploadProgress('Preparing repository...');

        try {
            // Handle both full URLs and paths
            const repositoryUrl = project.huggingface?.repository_url || '';
            const repoUrl = repositoryUrl.startsWith('http')
                ? repositoryUrl
                : `https://huggingface.co/${repositoryUrl}`;

            console.log('Starting upload process...');
            console.log('Project ID:', project._id);
            console.log('Repo URL:', repoUrl);

            // Step 1: Backend downloads HF repo and creates ZIP
            setUploadProgress('Backend is downloading repository (this may take several minutes)...');

            console.log('Calling /storage/prepare-upload...');
            const prepareResponse = await api.post('/storage/prepare-upload', {
                projectId: project._id,
                repoUrl,
            });

            console.log('Prepare response:', prepareResponse);

            if (!prepareResponse.downloadUrl) {
                throw new Error('Failed to prepare repository data');
            }

            // Step 2: Download ZIP from backend
            setUploadProgress('Downloading prepared data...');
            const zipResponse = await fetch(prepareResponse.downloadUrl, {
                credentials: 'include',
                mode: 'cors',
            });

            if (!zipResponse.ok) {
                throw new Error(`Failed to download prepared ZIP: ${zipResponse.status} ${zipResponse.statusText}`);
            }

            const zipBlob = await zipResponse.blob();
            const zipArrayBuffer = await zipBlob.arrayBuffer();
            const zipData = new Uint8Array(zipArrayBuffer);

            console.log('Downloaded ZIP:', zipData.length, 'bytes');

            // Step 3: Get user's wallet and initialize Synapse
            if (wallets.length === 0) {
                throw new Error('No wallet connected');
            }

            const wallet = wallets[0];

            setUploadProgress('Connecting to Synapse...');

            let provider;
            if (wallet.walletClientType === 'privy') {
                const privyProvider = await wallet.getEthereumProvider();
                provider = new ethers.BrowserProvider(privyProvider);
            } else {
                provider = await wallet.getEthersProvider();
            }

            const { Synapse } = await import('@filoz/synapse-sdk');
            const synapse = await Synapse.create({ provider });

            // Step 4: Upload to Filecoin using user's wallet
            setUploadProgress('Uploading to Filecoin (this may take several minutes)...');
            console.log('Uploading to Filecoin...');

            let uploadResult;
            let indexingTimeout = false;
            try {
                uploadResult = await synapse.storage.upload(zipData);
                console.log('Upload successful!', uploadResult);
            } catch (uploadErr: any) {
                // Check if this is just a timeout waiting for indexing (upload still succeeded)
                if (uploadErr.message && uploadErr.message.includes('Timeout waiting for piece to be parked')) {
                    console.log('Upload succeeded but storage provider indexing timed out (normal on testnet)');
                    console.log('Upload error details:', uploadErr);

                    // Extract pieceCid from error message
                    const pieceCidMatch = uploadErr.message.match(/bafk[a-z0-9]+/);
                    if (!pieceCidMatch) {
                        throw new Error('Upload succeeded but could not extract piece CID from response');
                    }

                    // Create a partial uploadResult object
                    uploadResult = {
                        pieceCid: pieceCidMatch[0],
                        size: zipData.length,
                        note: 'Storage provider indexing timed out (normal on testnet)'
                    };
                    indexingTimeout = true;
                    console.log('Using partial upload result:', uploadResult);
                } else {
                    // Actual upload failure
                    throw uploadErr;
                }
            }

            // Extract CID for display and saving
            const pieceCid = uploadResult.pieceCid;
            console.log('✅ Piece CID ready for backend:', pieceCid);

            // Show success toast with CID
            if (indexingTimeout) {
                addToast(`Upload succeeded! CID: ${pieceCid} (Indexing timeout is normal on testnet)`, 'success');
            } else {
                addToast(`Project uploaded successfully! CID: ${pieceCid}`, 'success');
            }

            // Step 5: Save CID to database
            setUploadProgress('Saving storage information...');

            await api.post('/storage/save-upload-result', {
                projectId: project._id,
                cid: pieceCid,
                size: uploadResult.size,
                daysOfStorage: selectedDuration,
                paymentTxHash: paymentTxHash || 'no_payment_tx',
            });

            console.log('✅ CID saved to backend successfully');

            setUploadProgress('Upload complete!');
            setStep('success');

            // Clean up provider
            const ethProvider = synapse.getProvider();
            if (ethProvider && typeof ethProvider.destroy === 'function') {
                await ethProvider.destroy();
            }

            // Call success callback after short delay
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            console.error('Upload error:', err);
            console.error('Error stack:', err.stack);

            const errorMessage = err?.message || 'Failed to upload project';
            setError(errorMessage);
            setStep('calculate');
            addToast(`Upload failed: ${errorMessage}`, 'error');
        }
    };

    const renderCalculateStep = () => (
        <div className="space-y-6">
            {/* Wallet Status */}
            {!isWalletConnected ? (
                <div className="flex items-start p-4 text-sm rounded-lg bg-status-warning-bg text-status-warning dark:bg-status-warning-bg-dark ring-1 ring-inset ring-status-warning/20">
                    <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Wallet not connected.</span>
                        <p className="mt-1">Please connect your wallet to proceed.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start p-4 text-sm rounded-lg bg-status-success-bg text-status-success dark:bg-status-success-bg-dark ring-1 ring-inset ring-status-success/20">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Wallet connected.</span>
                        <p className="mt-1 font-mono text-xs truncate">{walletAddress}</p>
                    </div>
                </div>
            )}

            {/* Project Info */}
            <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800">
                <h3 className="font-semibold mb-2 flex items-center">
                    <DatabaseIcon className="w-5 h-5 mr-2" />
                    Project to Store
                </h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    {project.title}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    Repository: {project.huggingface?.repository_url || 'Not linked'}
                </p>
            </div>

            {/* Estimated Size Input */}
            <div>
                <label htmlFor="dataSize" className="block text-sm font-semibold mb-2">
                    Estimated Data Size
                </label>
                <div className="relative">
                    <input
                        id="dataSize"
                        type="number"
                        min="1"
                        value={Math.round(estimatedSize / (1024 * 1024))}
                        onChange={(e) => setEstimatedSize(parseInt(e.target.value) * 1024 * 1024)}
                        className="w-full p-3 pr-16 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold">
                        MB
                    </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
                    This will be confirmed during upload
                </p>
            </div>

            {/* Storage Duration Selection */}
            <div>
                <label className="block text-sm font-semibold mb-3">
                    <ClockIcon className="inline w-4 h-4 mr-1" />
                    Storage Duration
                </label>

                {isLoadingPricing ? (
                    <div className="flex justify-center py-8">
                        <SpinnerIcon className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {pricingTiers.map((tier) => (
                            <button
                                key={tier.days}
                                onClick={() => setSelectedDuration(tier.days)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    selectedDuration === tier.days
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border dark:border-border-dark hover:border-primary/50'
                                }`}
                            >
                                <div className="font-semibold">{tier.label}</div>
                                <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                                    {tier.days} days
                                </div>
                                <div className="text-lg font-bold mt-2">
                                    {parseFloat(tier.cost.totalCost).toFixed(2)}
                                    <span className="text-sm font-normal ml-1">USDFC</span>
                                </div>
                                <div className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                    {parseFloat(tier.cost.perDay).toFixed(4)} per day
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Cost Breakdown */}
            {selectedTier && (
                <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 space-y-2 text-sm">
                    <div className="font-semibold mb-3">Cost Breakdown</div>
                    <div className="flex justify-between">
                        <span>Data size:</span>
                        <span className="font-mono">{selectedTier.cost.dataSizeMB} MB</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{selectedDuration} days</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Cost per day:</span>
                        <span className="font-mono">{parseFloat(selectedTier.cost.perDay).toFixed(6)} USDFC</span>
                    </div>
                    <div className="border-t border-border dark:border-border-dark my-2 pt-2"></div>
                    <div className="flex justify-between font-semibold text-base">
                        <span>Total (with 20% buffer):</span>
                        <span className="font-mono">{parseFloat(selectedTier.cost.costWithBuffer).toFixed(4)} USDFC</span>
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
                <p className="font-semibold">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary dark:text-text-dark-secondary">
                    <li>You'll approve USDFC token spending</li>
                    <li>Payment will be deposited to Synapse Payments</li>
                    <li>Your HuggingFace repo will be downloaded</li>
                    <li>Data will be compressed and uploaded to Filecoin</li>
                    <li>You'll receive a CID for accessing your data</li>
                </ul>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="py-12 text-center">
            <SpinnerIcon className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-2xl font-bold mb-2">Processing Payment</h3>
            <p className="text-text-secondary dark:text-dark-text-secondary">{paymentProgress}</p>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-4">
                Please approve transactions in your wallet...
            </p>
        </div>
    );

    const renderUploadingStep = () => (
        <div className="py-12 text-center">
            <SpinnerIcon className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-2xl font-bold mb-2">Uploading to Filecoin</h3>
            <p className="text-text-secondary dark:text-dark-text-secondary">{uploadProgress}</p>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-4">
                This may take a few minutes...
            </p>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="py-12 text-center">
            <CheckCircleIcon className="w-16 h-16 text-status-success mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
                Your project is now stored on Filecoin
            </p>
            <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 text-left">
                <p className="text-sm mb-2">
                    <span className="font-semibold">Storage duration:</span> {selectedDuration} days
                </p>
                <p className="text-sm">
                    <span className="font-semibold">Your data is now:</span>
                </p>
                <ul className="list-disc list-inside text-sm text-text-secondary dark:text-text-dark-secondary mt-2 space-y-1">
                    <li>Stored on Filecoin network</li>
                    <li>Accessible via CID</li>
                    <li>Verifiable and immutable</li>
                </ul>
            </div>
        </div>
    );

    const renderFooter = () => {
        if (step === 'uploading' || step === 'success') {
            return null;
        }

        return (
            <div className="flex justify-end space-x-4">
                {step === 'payment' && (
                    <button
                        onClick={() => setStep('calculate')}
                        className="font-semibold py-2.5 px-6 rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handlePayment}
                    disabled={!isWalletConnected || !selectedTier || isLoadingPricing}
                    className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                >
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Pay & Upload
                </button>
            </div>
        );
    };

    return (
        <Modal
            onClose={onClose}
            title="Storage & PoR Payment"
            footer={renderFooter()}
            maxWidth="max-w-2xl"
        >
            <div className="p-1">
                {step === 'calculate' && renderCalculateStep()}
                {step === 'payment' && renderPaymentStep()}
                {step === 'uploading' && renderUploadingStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </Modal>
    );
};
