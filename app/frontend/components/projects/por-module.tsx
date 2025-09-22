import React from "react";
import { Project, Reproducibility, PoRStatus } from "../../lib/types";
import { useApi } from "../../context/api-context";
import {
  EyeIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  BeakerIcon,
  ClipboardCheckIcon,
} from "../ui/icons";
import { MOCK_USERS } from "../../lib/constants";
import { Tooltip } from "../ui/tooltip";

const PoRTimelineItem = ({
  rep,
  onView,
  isLast,
}: {
  rep: Reproducibility;
  onView: () => void;
  isLast: boolean;
}) => {
  const statusConfig = {
    [PoRStatus.Success]: {
      icon: CheckCircleIcon,
      color: "text-status-success",
      bg: "bg-status-success-bg dark:bg-status-success-bg-dark",
      text: "Success",
    },
    [PoRStatus.Waiting]: {
      icon: ClockIcon,
      color: "text-status-warning",
      bg: "bg-status-warning-bg dark:bg-status-warning-bg-dark",
      text: "Waiting",
    },
    [PoRStatus.Disputed]: {
      icon: FlagIcon,
      color: "text-status-danger",
      bg: "bg-status-danger-bg dark:bg-status-danger-bg-dark",
      text: "Disputed",
    },
  };
  const config = statusConfig[rep.status];
  const Icon = config.icon;

  // Handle both object and string verifier types
  const getVerifierName = (verifier: any) => {
    if (!verifier) return "Unknown";

    // If verifier is an object with username or email
    if (typeof verifier === "object" && verifier.username) {
      return verifier.username;
    }
    if (typeof verifier === "object" && verifier.email) {
      return verifier.email;
    }

    // If verifier is a string (wallet address), try to find in MOCK_USERS
    if (typeof verifier === "string") {
      const user = MOCK_USERS.find((u) => u.walletAddress === verifier);
      if (user) return user.name;
      return verifier.length > 10
        ? verifier.substring(0, 10) + "..."
        : verifier;
    }

    return "Unknown";
  };

  const authorName = getVerifierName(rep.verifier);

  return (
    <div className="relative flex items-start">
      {!isLast && (
        <div className="absolute top-5 left-[11px] h-full w-0.5 bg-border dark:bg-border-dark" />
      )}
      <div
        className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="ml-4 flex-grow">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm text-text-primary dark:text-dark-text-primary">
            {config.text} by{" "}
            <span
              title={
                typeof rep.verifier === "string"
                  ? rep.verifier
                  : rep.verifier?.email || "Unknown"
              }
            >
              {authorName}
            </span>
          </p>
          <button
            onClick={onView}
            className="p-1 rounded-full text-text-secondary hover:bg-hf-gray-200 dark:hover:bg-hf-gray-800"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
          {new Date(rep.timestamp).toLocaleDateString()}
        </p>
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
  const { downloadFilecoinFile, isLoading, error } = useApi();

  const hasSuccessPor = React.useMemo(
    () => project.reproducibilities.some((r) => r.status === PoRStatus.Success),
    [project.reproducibilities]
  );

  // Extract CID for proof download
  const getProofCID = () => {
    // First try to get CID from project level
    if (project.cid && project.cid.trim()) {
      return project.cid;
    }

    // Then try to extract from successful reproducibility notes
    const successfulReproducibility = project.reproducibilities.find(
      (r) => r.status === PoRStatus.Success
    );

    if (successfulReproducibility?.notes) {
      // Extract CID from notes like "Proof of Reproducibility stored at CID: bafkzcibd..."
      const cidMatch = successfulReproducibility.notes.match(
        /CID:\s*([a-zA-Z0-9]+)/
      );
      if (cidMatch && cidMatch[1]) {
        return cidMatch[1];
      }
    }

    return null;
  };

  const handleDownloadProof = async () => {
    const cid = getProofCID();
    if (!cid) {
      console.error("No CID found for proof of reproducibility");
      return;
    }

    try {
      await downloadFilecoinFile(
        cid,
        `${project.title}_proof_of_reproducibility.zip`
      );
    } catch (err) {
      console.error("Failed to download proof:", err);
    }
  };

  const proofCID = getProofCID();

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark flex flex-col">
      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">
            Download error: {error}
          </p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
        Reproducibility
      </h3>

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
            <h4 className="mt-4 text-md font-semibold text-text-primary dark:text-dark-text-primary">
              Not Yet Tested
            </h4>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
              This project has not been submitted for reproducibility
              evaluation.
            </p>
            {!isOwner && (
              <button
                onClick={onPorSubmitClick}
                className="mt-6 flex items-center mx-auto space-x-2 bg-primary text-primary-text font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors text-sm shadow-md"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Be the First to Evaluate</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border dark:border-border-dark">
        <button
          onClick={handleDownloadProof}
          disabled={!hasSuccessPor || !proofCID || isLoading}
          className="w-full flex items-center justify-center space-x-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-light text-primary hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-light dark:disabled:hover:bg-primary/20"
        >
          <ClipboardCheckIcon className="w-5 h-5" />
          <span>
            {isLoading
              ? "Downloading..."
              : proofCID
              ? "Download Proof from Filecoin"
              : "No Proof Available"}
          </span>
        </button>
        {proofCID && (
          <p className="mt-2 text-xs text-text-secondary dark:text-dark-text-secondary text-center">
            CID:{" "}
            {proofCID.length > 20
              ? proofCID.substring(0, 20) + "..."
              : proofCID}
          </p>
        )}
      </div>
    </div>
  );
}
