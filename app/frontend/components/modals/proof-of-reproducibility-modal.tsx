"use client";

import React from 'react';
import { Project, PoRStatus } from '../../lib/types';
import { Modal } from '../ui/modal';
import { CopyableInfoRow } from '../ui/copyable-info-row';
import { CheckBadgeIcon } from '../ui/icons';

export const ProofOfReproducibilityModal = ({ project, onClose }: { project: Project; onClose: () => void; }) => {
    // Find the latest successful PoR to display
    const latestSuccessPoR = React.useMemo(() => {
        return [...project.reproducibilities]
            .filter(r => r.status === PoRStatus.Success)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }, [project.reproducibilities]);

    // Mock on-chain data based on the PoR and project details
    const onChainData = React.useMemo(() => {
        if (!latestSuccessPoR) return null;
        const hashBase = `${project.id}-${latestSuccessPoR.id}`;
        const simpleHash = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
            return Math.abs(hash).toString(16);
        };

        return {
            verifier: latestSuccessPoR.verifier,
            timestamp: new Date(latestSuccessPoR.timestamp).toUTCString(),
            filecoinTxHash: `bafy2bzacec${simpleHash(hashBase).slice(0, 50)}`,
            storageDealId: `baga6ea4seaq${simpleHash(hashBase + 'deal').slice(0, 25)}`,
            payloadCid: latestSuccessPoR.evidence[0]?.data.ipfsCid || `bafkreibm${simpleHash(hashBase + 'payload').slice(0, 50)}`,
        };
    }, [project.id, latestSuccessPoR]);

    return (
        <Modal onClose={onClose} title="On-chain Proof of Reproducibility">
            {onChainData ? (
                <div className="space-y-6">
                    <div className="text-center p-6 bg-status-success-bg dark:bg-status-success-bg-dark rounded-xl border border-status-success/20">
                        <CheckBadgeIcon className="w-12 h-12 text-status-success mx-auto" />
                        <h3 className="text-xl font-bold mt-2 text-text dark:text-text-dark">Verification Recorded On-chain</h3>
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
                            This data is recorded on the Filecoin network, ensuring permanent and tamper-proof evidence.
                        </p>
                    </div>
                    <div className="p-4 border border-border dark:border-border-dark rounded-lg font-mono text-sm space-y-2">
                        <CopyableInfoRow label="Verifier" value={onChainData.verifier} />
                        <CopyableInfoRow label="Timestamp (UTC)" value={onChainData.timestamp} />
                        <CopyableInfoRow label="Filecoin Tx Hash" value={onChainData.filecoinTxHash} />
                        <CopyableInfoRow label="Storage Deal ID" value={onChainData.storageDealId} />
                        <CopyableInfoRow label="Payload CID" value={onChainData.payloadCid} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-text-secondary dark:text-text-dark-secondary">No successful Proof-of-Reproducibility found for this project.</p>
                </div>
            )}
        </Modal>
    );
};