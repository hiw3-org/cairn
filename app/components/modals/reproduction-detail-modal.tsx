
"use client";

import { Reproducibility, PoRStatus } from "../../lib/types";
import { Modal } from "../ui/modal";
import { OutputListItem } from "../projects/output-list-item";
import { FlagIcon, ClockIcon, CheckCircleIcon } from "../ui/icons";
import React from "react";


const PoRStatusBadge = ({ status, className = '' }: { status: PoRStatus, className?: string }) => {
    const statusConfig = {
        [PoRStatus.Success]: {
            icon: CheckCircleIcon,
            color: 'text-green-500',
            text: 'Success',
        },
        [PoRStatus.Waiting]: {
            icon: ClockIcon,
            color: 'text-yellow-500',
            text: 'Waiting',
        },
        [PoRStatus.Disputed]: {
            icon: FlagIcon,
            color: 'text-red-500',
            text: 'Disputed',
        },
    };
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`flex items-center space-x-2 px-2 py-1 text-xs font-medium rounded-full ${config.color} bg-opacity-10 ${className}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={config.color}>{config.text}</span>
        </div>
    );
};

export const ReproducibilityDetailModal = ({ reproducibility, onClose, onDispute, isOwner }: { reproducibility: Reproducibility, onClose: () => void, onDispute: () => void, isOwner: boolean }) => {
    return (
        <Modal onClose={onClose} title="Submission Details">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <label className="block text-sm font-medium text-cairn-gray-400">Verifier</label>
                        <p className="font-mono text-lg">{reproducibility.verifier}</p>
                    </div>
                     <PoRStatusBadge status={reproducibility.status} className="bg-cairn-gray-100 dark:bg-cairn-gray-800" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-cairn-gray-400">Timestamp</label>
                    <p className="text-lg">{new Date(reproducibility.timestamp).toLocaleDateString()}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-cairn-gray-400">Notes & Methodology</label>
                    <div className="mt-1 p-3 bg-cairn-gray-100 dark:bg-cairn-gray-800 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{reproducibility.notes}</p>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-cairn-gray-400 mb-2">Evidence ({reproducibility.evidence.length})</label>
                    {reproducibility.evidence.length > 0 ? (
                        <ul className="divide-y divide-cairn-gray-200 dark:divide-cairn-gray-700">
                            {reproducibility.evidence.map(output => (
                                <OutputListItem key={output.id} output={output} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-cairn-gray-500">No evidence was provided with these notes.</p>
                    )}
                </div>

                {reproducibility.status === PoRStatus.Waiting && !isOwner && (
                     <div className="mt-6 p-4 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg space-y-3">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">This Submission is under review</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            There is a 7-day waiting period during which any community member can dispute the validity of this submission.
                        </p>
                        <button onClick={onDispute} className="w-full sm:w-auto flex items-center justify-center space-x-2 border-2 border-red-300 bg-transparent text-red-500 font-semibold py-2 px-4 rounded-lg hover:bg-red-500/10 transition-colors">
                           <FlagIcon className="w-5 h-5" />
                           <span>Dispute Submission</span>
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
