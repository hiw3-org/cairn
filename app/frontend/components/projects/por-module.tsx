import React from "react";
import { Project, Reproducibility, PoRStatus } from "../../lib/types";
import { downloadFromFileCoin } from "../../utils/filecoin";
import {
  EyeIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  BeakerIcon,
  ClipboardCheckIcon,
} from "../ui/icons";
import { Tooltip } from "../ui/tooltip";

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  // Check if project has reached Phase2 (successful PoR) or has a POR CID available
  const hasSuccessPor =
    project.por_status === "Phase2" ||
    (project.por?.por_cid && project.por.por_cid.trim());

  // Get the appropriate CID for downloading proof
  const getProofCID = () => {
    // Try POR CID first
    if (project.por?.por_cid && project.por.por_cid.trim()) {
      return project.por.por_cid;
    }

    // Fallback to HuggingFace contents CID
    if (
      project.huggingface?.contents_cid &&
      project.huggingface.contents_cid.trim()
    ) {
      return project.huggingface.contents_cid;
    }

    return null;
  };

  const handleDownloadProof = async () => {
    const cid = getProofCID();
    if (!cid) {
      setDownloadError("No CID found for proof of reproducibility");
      return;
    }

    try {
      setIsLoading(true);
      setDownloadError(null);

      const result = await downloadFromFileCoin({
        walletAddress: import.meta.env.VITE_FILECOIN_WALLET_ADDRESS || "",
        pieceCID: cid,
        filename: `${project.title}_proof_of_reproducibility.zip`,
      });

      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      console.log(`Successfully downloaded proof: ${result.filename}`);
    } catch (err: any) {
      console.error("Failed to download proof:", err);
      setDownloadError(err.message || "Failed to download proof");
    } finally {
      setIsLoading(false);
    }
  };

  const proofCID = getProofCID();

  // Create a status display based on the actual project data
  const statusConfig = React.useMemo(() => {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.log("Project has POR CID:", project.por?.por_cid);
    }
    if (project.por?.por_cid && project.por.por_cid.trim()) {
      return {
        icon: CheckCircleIcon,
        color: "text-status-success",
        bg: "bg-status-success-bg dark:bg-status-success-bg-dark",
        text: "Reproducible",
        description: "This project has a proof of reproducibility available.",
      };
    } else {
      return {
        icon: ClockIcon,
        color: "text-status-warning",
        bg: "bg-status-warning-bg dark:bg-status-warning-bg-dark",
        text: "In Review",
        description: "This project is under review for reproducibility.",
      };
    }
  }, [project]);

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark flex flex-col">
      {/* Error display */}
      {downloadError && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">
            Download error: {downloadError}
          </p>
          <button
            onClick={() => setDownloadError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
        Reproducibility
      </h3>

      <div className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-start space-x-3">
          <div
            className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${statusConfig.bg}`}
          >
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-sm text-text-primary dark:text-dark-text-primary">
              {statusConfig.text}
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
              {statusConfig.description}
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
              Last updated: {new Date(project.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-background dark:bg-background-dark rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-dark-text-secondary">
              Field:
            </span>
            <span className="text-text-primary dark:text-dark-text-primary font-medium">
              {project.field}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-dark-text-secondary">
              Status:
            </span>
            <span className="text-text-primary dark:text-dark-text-primary font-medium">
              {project.project_status}
            </span>
          </div>
          {project.funded_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary dark:text-dark-text-secondary">
                Funding:
              </span>
              <span className="text-text-primary dark:text-dark-text-primary font-medium">
                ${project.funded_amount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {project.por_status === "InReview" && !isOwner && (
            <button
              onClick={onPorSubmitClick}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-text font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors text-sm shadow-md"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Submit Reproducibility Evidence</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={onGetProofClick}
              className="w-full flex items-center justify-center space-x-2 bg-secondary text-secondary-text font-semibold py-2 px-4 rounded-lg hover:bg-secondary-hover transition-colors text-sm"
            >
              <BeakerIcon className="w-4 h-4" />
              <span>Get Proof of Reproducibility</span>
            </button>
          )}
        </div>
      </div>

      {/* Download Proof Section */}
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
              : proofCID && hasSuccessPor
              ? "Download Proof from Filecoin"
              : hasSuccessPor
              ? "No Proof CID Available"
              : "Proof Not Yet Available"}
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
