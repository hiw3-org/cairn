import React from "react";
import { Project, Reproducibility, PoRStatus } from "../../lib/types";
import { EyeIcon, FlagIcon, ClockIcon, CheckCircleIcon, PlusIcon, BeakerIcon, ClipboardCheckIcon } from "../ui/icons";
import { MOCK_USERS } from "../../lib/constants";
import { Tooltip } from "../ui/tooltip";

const PoRTimelineItem = ({ rep, onView, isLast }: { rep: Reproducibility, onView: () => void, isLast: boolean }) => {
  const statusConfig = {
        [PoRStatus.Success]: { icon: CheckCircleIcon, color: 'text-status-success', bg: 'bg-status-success-bg dark:bg-status-success-bg-dark', text: 'Success' },
        [PoRStatus.Waiting]: { icon: ClockIcon, color: 'text-status-warning', bg: 'bg-status-warning-bg dark:bg-status-warning-bg-dark', text: 'Waiting' },
        [PoRStatus.Disputed]: { icon: FlagIcon, color: 'text-status-danger', bg: 'bg-status-danger-bg dark:bg-status-danger-bg-dark', text: 'Disputed' },
  };
    const config = statusConfig[rep.status];
  const Icon = config.icon;
    const authorName = MOCK_USERS.find(u => u.walletAddress === rep.verifier)?.name || rep.verifier.substring(0, 10) + '...';

  return (
        <div className="relative flex items-start">
            {!isLast && <div className="absolute top-5 left-[11px] h-full w-0.5 bg-border dark:bg-border-dark" />}
            <div className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="ml-4 flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm text-text-primary dark:text-dark-text-primary">{config.text} by <span title={rep.verifier}>{authorName}</span></p>
                    <button onClick={onView} className="p-1 rounded-full text-text-secondary hover:bg-hf-gray-200 dark:hover:bg-hf-gray-800">
                        <EyeIcon className="w-4 h-4"/>
                    </button>
                </div>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{new Date(rep.timestamp).toLocaleDateString()}</p>
            </div>
    </div>
  );
};

export default function PoRModule({
  project,
  isOwner,
  onPorSubmitClick,
  onViewReproducibility,
    onGetProofClick,
}: {
  project: Project;
  isOwner: boolean;
  onPorSubmitClick: () => void;
  onViewReproducibility: (rep: Reproducibility) => void;
    onGetProofClick: () => void;
}) {
    const hasSuccessPor = React.useMemo(() => 
        project.reproducibilities.some(r => r.status === PoRStatus.Success), 
    [project.reproducibilities]);

  return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark flex flex-col">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">Reproducibility</h3>
            
            <div>
                {project.reproducibilities.length > 0 ? (
                    <div className="space-y-6">
                        {project.reproducibilities.map((rep, index) => (
                            <PoRTimelineItem 
                                key={rep.id} 
                                rep={rep} 
                                onView={() => onViewReproducibility(rep)} 
                                isLast={index === project.reproducibilities.length - 1} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 flex flex-col justify-center items-center">
                        <BeakerIcon className="mx-auto h-12 w-12 text-text-secondary/50" />
                        <h4 className="mt-4 text-md font-semibold text-text-primary dark:text-dark-text-primary">Not Yet Tested</h4>
                        <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                            This project has not been submitted for reproducibility evaluation.
                        </p>
      {!isOwner && (
                            <button onClick={onPorSubmitClick} className="mt-6 flex items-center mx-auto space-x-2 bg-primary text-primary-text font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors text-sm shadow-md">
                                <PlusIcon className="w-4 h-4" />
                                <span>Be the First to Evaluate</span>
          </button>
          )}
        </div>
      )}
            </div>

            <div className="mt-6 pt-4 border-t border-border dark:border-border-dark">
                        <button
                    onClick={onGetProofClick}
                    disabled={!hasSuccessPor}
                    className="w-full flex items-center justify-center space-x-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-light text-primary hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-light dark:disabled:hover:bg-primary/20"
                >
                    <ClipboardCheckIcon className="w-5 h-5" />
                    <span>Get Proof of Reproducibility</span>
                        </button>
                      </div>
    </div>
  );
};