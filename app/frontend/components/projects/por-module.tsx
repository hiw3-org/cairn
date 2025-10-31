import React from "react";
import { Project } from "../../lib/types";
import { downloadFromFileCoin } from "../../utils/filecoin";
import {
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  DownloadIcon,
} from "../ui/icons";

export default function PoRModule({ project }: { project: Project }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  // Get status configuration based on por_status
  const statusConfig = React.useMemo(() => {
    switch (project.por_status) {
      case "Phase2":
        return {
          icon: CheckCircleIcon,
          color: "text-status-success",
          bg: "bg-status-success-bg dark:bg-status-success-bg-dark",
          text: "Phase 2 - Verified",
          description:
            "This project has been fully verified and is reproducible.",
        };
      case "Phase1":
        return {
          icon: CheckCircleIcon,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "Phase 1 - Initial Verification",
          description: "This project has passed initial verification.",
        };
      case "Disputed":
        return {
          icon: FlagIcon,
          color: "text-status-danger",
          bg: "bg-status-danger-bg dark:bg-status-danger-bg-dark",
          text: "Disputed",
          description: "This project's reproducibility is under dispute.",
        };
      case "InReview":
      default:
        return {
          icon: ClockIcon,
          color: "text-status-warning",
          bg: "bg-status-warning-bg dark:bg-status-warning-bg-dark",
          text: "In Review",
          description: "This project is awaiting reproducibility verification.",
        };
    }
  }, [project.por_status]);

  const StatusIcon = statusConfig.icon;
  const canDownload = project.por_status !== "InReview" && project.por?.por_cid;

  const handleDownloadProof = async () => {
    if (!project.por?.por_cid) {
      setDownloadError("No CID available for download");
      return;
    }

    try {
      setIsLoading(true);
      setDownloadError(null);

      const result = await downloadFromFileCoin({
        walletAddress: import.meta.env.VITE_FILECOIN_WALLET_ADDRESS || "",
        pieceCID: project.por.por_cid,
        filename: `${project.title}_PoR.zip`,
      });

      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      console.log(`Successfully downloaded PoR: ${result.filename}`);
    } catch (err: any) {
      console.error("Failed to download PoR:", err);
      setDownloadError(err.message || "Failed to download proof");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark">
      {/* Error display */}
      {downloadError && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">
            {downloadError}
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
        Proof of Reproducibility Status
      </h3>

      <div className="space-y-4">
        {/* Status Display */}
        <div className="flex items-start space-x-3">
          <div
            className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${statusConfig.bg}`}
          >
            <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-base text-text-primary dark:text-dark-text-primary">
              {statusConfig.text}
            </p>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
              {statusConfig.description}
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-2">
              Last updated: {new Date(project.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* CID Display */}
        {project.por?.por_cid && (
          <div className="bg-background dark:bg-background-dark rounded-lg p-3">
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-1">
              Proof CID:
            </p>
            <p className="text-sm font-mono text-text-primary dark:text-dark-text-primary break-all">
              {project.por.por_cid}
            </p>
          </div>
        )}

        {/* Download Button */}
        {canDownload && (
          <button
            onClick={handleDownloadProof}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-text font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-5 h-5" />
            <span>
              {isLoading ? "Downloading..." : "Download Proof from Filecoin"}
            </span>
          </button>
        )}

        {!canDownload && project.por_status === "InReview" && (
          <div className="text-center py-3 px-4 bg-hf-gray-100 dark:bg-hf-gray-800 rounded-lg">
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Proof will be available after verification is complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
