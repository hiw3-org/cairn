import React from "react";
import { Project, Reproducibility, ProjectStatus, PoRStatus } from "../../lib/types";
import { EyeIcon, FlagIcon, ClockIcon, CheckCircleIcon } from "../ui/icons";
import { MOCK_USERS } from "../../lib/constants";

const PoRStatusBadge = ({ status }: { status: PoRStatus }) => {
    const statusConfig = {
        [PoRStatus.Success]: {
            icon: CheckCircleIcon,
            color: 'text-green-500',
            text: 'Success: This submission has been successfully verified.',
        },
        [PoRStatus.Waiting]: {
            icon: ClockIcon,
            color: 'text-yellow-500',
            text: 'Waiting: This submission is in a 7-day dispute window.',
        },
        [PoRStatus.Disputed]: {
            icon: FlagIcon,
            color: 'text-red-500',
            text: 'Disputed: This submission has been flagged and is under review.',
        },
    };
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="relative group flex items-center justify-center">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className="absolute bottom-full mb-2 w-max max-w-xs px-2 py-1 bg-cairn-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {config.text}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-cairn-gray-800"></div>
            </span>
        </div>
    );
};


export default function PoRModule({
    project,
    isOwner,
    onPorSubmitClick,
    onViewReproducibility,
}: {
    project: Project;
    isOwner: boolean;
    onPorSubmitClick: () => void;
    onViewReproducibility: (rep: Reproducibility) => void;
}) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Reproducibility</h3>
            
            {!isOwner && project.status === ProjectStatus.Active && (
                 <button onClick={onPorSubmitClick} className="w-full bg-cairn-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-colors shadow-md hover:shadow-lg">
                    Submit for Reproducibility
                </button>
            )}
            <div>
                <h4 className="font-semibold mb-2">Submissions ({project.reproducibilities.length})</h4>
                 <div className="border border-cairn-gray-200 dark:border-cairn-gray-700/80 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-cairn-gray-100 dark:bg-cairn-gray-800/50 text-left text-xs text-cairn-gray-500 dark:text-cairn-gray-400 uppercase">
                            <tr>
                                <th className="p-3 font-semibold text-center">Status</th>
                                <th className="p-3 font-semibold">Author</th>
                                <th className="p-3 font-semibold">Timestamp</th>
                                <th className="p-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cairn-gray-200 dark:divide-cairn-gray-700">
                        {project.reproducibilities.map((rep, index) => {
                            const author = MOCK_USERS.find(u => u.walletAddress === rep.verifier);
                            const rowClass = index % 2 === 0 ? 'bg-white dark:bg-cairn-gray-900/50' : 'bg-cairn-gray-50 dark:bg-cairn-gray-800/50';
                            return (
                                <tr key={rep.id} className={`${rowClass} hover:bg-cairn-blue-50 dark:hover:bg-cairn-blue-900/20 transition-colors`}>
                                    <td className="p-3 text-center"><PoRStatusBadge status={rep.status} /></td>
                                    <td className="p-3" title={rep.verifier}>
                                        <span className="font-semibold text-cairn-gray-800 dark:text-cairn-gray-200">
                                            {author ? author.name : `${rep.verifier.substring(0, 12)}...`}
                                        </span>
                                    </td>
                                    <td className="p-3 text-cairn-gray-600 dark:text-cairn-gray-300">{rep.timestamp}</td>
                                    <td className="p-3">
                                        <div className="flex justify-end items-center space-x-2">
                                            <button 
                                                onClick={() => onViewReproducibility(rep)} 
                                                className="bg-cairn-gray-200 dark:bg-cairn-gray-700 text-cairn-gray-700 dark:text-cairn-gray-200 text-xs font-semibold py-1 px-2.5 rounded-md hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600 transition-colors"
                                                title="View Details"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                         {project.reproducibilities.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-cairn-gray-500 bg-white dark:bg-cairn-gray-900/50">No submissions yet.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};