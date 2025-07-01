import { useMemo } from 'react';
import { ProjectStatus } from '../../lib/types';

export const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    const colorClasses = useMemo(() => {
        switch (status) {
            case ProjectStatus.Active: return 'bg-cairn-blue-100 text-cairn-blue-800 dark:bg-cairn-blue-900/50 dark:text-cairn-blue-200 ring-cairn-blue-600/20 dark:ring-cairn-blue-400/30';
            case ProjectStatus.Funded: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 ring-green-600/20 dark:ring-green-400/30';
            case ProjectStatus.Draft: return 'bg-cairn-gray-100 text-cairn-gray-800 dark:bg-cairn-gray-700 dark:text-cairn-gray-200 ring-cairn-gray-500/20 dark:ring-cairn-gray-400/20';
            case ProjectStatus.Archived: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 ring-red-600/10 dark:ring-red-400/20';
            default: return 'bg-cairn-gray-100 text-cairn-gray-800 dark:bg-cairn-gray-700 dark:text-cairn-gray-200 ring-cairn-gray-500/20';
        }
    }, [status]);
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${colorClasses}`}>{status}</span>;
};