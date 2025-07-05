"use client";

import { Reproducibility, PoRStatus, DisputeData } from "../../lib/types";
import { Modal } from "../ui/modal";
import { EyeIcon, FlagIcon, ClockIcon, CheckCircleIcon } from "../ui/icons";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useContract } from "../../context/contract-context";
import { useAppContext } from "@/context/app-provider";

const PoRStatusBadge = ({ rep }: { rep: Reproducibility }) => {
  let status: PoRStatus;

  if (rep.valid === true) {
    status = PoRStatus.Success;
  } else if (rep.dispute === true) {
    status = PoRStatus.Disputed;
  } else {
    status = PoRStatus.Waiting;
  }

  const statusConfig = {
    [PoRStatus.Success]: {
      icon: CheckCircleIcon,
      color: "text-status-success",
      text: "Success: This submission has been successfully verified.",
    },
    [PoRStatus.Waiting]: {
      icon: ClockIcon,
      color: "text-status-warning",
      text: "Waiting: This submission is in a 7-day dispute window.",
    },
    [PoRStatus.Disputed]: {
      icon: FlagIcon,
      color: "text-status-danger",
      text: "Disputed: This submission has been flagged and is under review.",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="relative group flex items-center justify-center">
      <Icon className={`w-5 h-5 ${config.color}`} />
      <span className="absolute bottom-full mb-2 w-max max-w-xs px-2 py-1 bg-text text-background-light text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {config.text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-text"></div>
      </span>
    </div>
  );
};

export const ReproducibilityDetailModal = ({
  reproducibility,
  onClose,
  onDispute,
  isOwner,
}: {
  reproducibility: Reproducibility;
  onClose: () => void;
  onDispute: () => void;
  isOwner: boolean;
}) => {
  const { uploadDispute } = useIpfsService();
  const { contractDisputeProof } = useContract();

  const handleDispute = async () => {
    if (onDispute) {
      onDispute();
    }
  };
  return (
    <Modal onClose={onClose} title="Submission Details">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              Verifier
            </label>
            <p className="font-mono text-lg text-text dark:text-text-dark">
              {reproducibility.recorder}
            </p>
          </div>
          <PoRStatusBadge rep={reproducibility} />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            Timestamp
          </label>
          <p className="text-lg text-text dark:text-text-dark">
            {new Date(
              Number(reproducibility.timestamp) * 1000
            ).toLocaleDateString()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            Notes & Methodology
          </label>
          <div className="mt-1 p-3 bg-cairn-gray-100 dark:bg-cairn-gray-800 rounded-md">
            <p className="text-sm whitespace-pre-wrap text-text-secondary dark:text-text-dark-secondary">
              {reproducibility.description}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-2">
            Evidence
          </label>
          <ul className="space-y-2">
            <li>
              <p className="text-sm font-medium text-text dark:text-text-dark">
                Code:
              </p>
              <a
                href={reproducibility.code_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {reproducibility.code_url}
              </a>
            </li>
            <li>
              <p className="text-sm font-medium text-text dark:text-text-dark">
                Output:
              </p>
              <a
                href={reproducibility.output_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {reproducibility.output_url}
              </a>
            </li>
            {reproducibility.video_url && (
              <li>
                <p className="text-sm font-medium text-text dark:text-text-dark">
                  Video:
                </p>
                <a
                  href={reproducibility.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {reproducibility.video_url}
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Show dispute section only if in 'Waiting' state */}
        {reproducibility.valid !== true &&
          reproducibility.dispute !== true &&
          !isOwner && (
            <div className="mt-6 p-4 border border-status-warning/30 bg-status-warning-bg dark:bg-status-warning-bg-dark/50 rounded-lg space-y-3">
              <h4 className="font-semibold text-status-warning">
                This Submission is under review
              </h4>
              <p className="text-sm text-status-warning/80">
                There is a 7-day waiting period during which any community
                member can dispute the validity of this submission. ** It was
                made shorter for the hackathon demo
              </p>
              <button
                onClick={handleDispute}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 border-2 border-status-danger bg-transparent text-status-danger font-semibold py-2 px-4 rounded-lg hover:bg-status-danger/10 transition-colors"
              >
                <FlagIcon className="w-5 h-5" />
                <span>Dispute Submission</span>
              </button>
            </div>
          )}
      </div>
    </Modal>
  );
};
