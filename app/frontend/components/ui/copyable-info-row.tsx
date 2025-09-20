
"use client";

import React from 'react';
import { useClipboard } from '../../hooks/use-clipboard';
import { CopyIcon, CheckIcon } from './icons';

export const CopyableInfoRow = ({ label, value }: { label: string, value: string }) => {
    const { copy, copied } = useClipboard();

    return (
        <div className="flex items-center justify-between group py-1">
            <span className="text-text-secondary dark:text-text-dark-secondary flex-shrink-0 mr-4">{label}</span>
            <div className="flex items-center space-x-2 flex-grow min-w-0">
                <span className="text-text dark:text-text-dark break-all" title={value}>{value}</span>
                <button 
                    onClick={() => copy(value)} 
                    className="p-1 rounded-full text-text-secondary dark:text-text-dark-secondary hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Copy ${label}`}
                >
                    {copied ? <CheckIcon className="h-4 w-4 text-status-success" /> : <CopyIcon className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
};
