"use client";

import {
  Project,
  Reproducibility,
  Output,
  ProjectStatus,
  ReproducibilityStatus,
} from "../../lib/types";
import { downloadFromFileCoin } from "../../utils/filecoin"; // Import the new utility
import {
  ChevronLeftIcon,
  DownloadIcon,
  StarIcon,
  BookOpenIcon,
  CopyIcon,
  CheckIcon,
  ShareIcon,
  CitationIcon,
  BeakerIcon,
  StarFilledIcon,
  StorageIcon,
} from "../ui/icons";
import { StatusBadge } from "../ui/status-badge";
import PoRModule from "./por-module";
import { useAppContext } from "../../context/app-provider";
import React from "react";
import { useClipboard } from "../../hooks/use-clipboard";
import { ReproducibilityBadge } from "../ui/reproducibility-badge";
import { MOCK_USERS } from "../../lib/constants";

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const AddressWithCopy = ({ address }: { address: string }) => {
  const { copy, copied } = useClipboard();
  const userName =
    MOCK_USERS.find((u) => u.walletAddress === address)?.name || "Unknown User";
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex items-center space-x-2 group">
      <span
        className="font-mono text-sm text-text-secondary dark:text-text-dark-secondary"
        title={`${userName} - ${address}`}
      >
        {formatAddress(address)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          copy(address);
        }}
        className="p-1 rounded-full text-text-secondary hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy address"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-status-success" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

const FundingAndOwnershipWidget = ({ project }: { project: Project }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark">
      <div className="space-y-6">
        {/* Funding Section */}
        <div>
          <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-3">
            Funding
          </h3>
          <div className="p-4 rounded-lg bg-cairn-gray-50 dark:bg-cairn-gray-900/50">
            <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary">
              Total Raised
            </p>
            <p className="text-3xl font-bold text-status-success mt-1">
              $
              {project.fundingPool > 0
                ? project.fundingPool.toLocaleString()
                : "0"}
            </p>
          </div>
        </div>

        {/* Ownership Section */}
        {project.impactAssetOwners && project.impactAssetOwners.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-2">
              Ownership
            </h3>
            <ul className="space-y-2">
              {project.impactAssetOwners.map((owner, index) => (
                <li
                  key={index}
                  className="py-2 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-text dark:text-text-dark text-sm">
                      {owner.contribution}
                    </p>
                    <AddressWithCopy address={owner.walletAddress} />
                  </div>
                  <span className="text-lg font-bold text-primary dark:text-primary-light flex-shrink-0 ml-4">
                    {owner.ownershipPercentage.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ImpactMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<any>;
  label: string;
  value: string | number;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light p-4 rounded-lg border border-border dark:border-border-dark">
    <div className="flex items-center space-x-2">
      <Icon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" />
      <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
        {label}
      </p>
    </div>
    <p className="mt-1 text-2xl font-bold text-text dark:text-text-dark">
      {value}
    </p>
  </div>
);

const OutputCard = ({
  output,
  projectStatus,
  project,
}: {
  output: Output;
  projectStatus: ProjectStatus;
  project: Project;
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const reproducibilityStatus: ReproducibilityStatus =
    projectStatus === ProjectStatus.Reproducible ||
    projectStatus === ProjectStatus.Funded
      ? "Verified"
      : "Pending";

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      // Check if output has a CID for Filecoin download
      if (output.data && output.data.cid && output.data.cid.trim()) {
        // Use the new utility function for FileCoin download with output-specific CID
        const walletAddress = import.meta.env.VITE_FILECOIN_WALLET_ADDRESS;
        if (!walletAddress || typeof walletAddress !== "string" || walletAddress.trim() === "") {
          throw new Error("Missing required environment variable: VITE_FILECOIN_WALLET_ADDRESS");
        }
        const result = await downloadFromFileCoin({
          walletAddress,
          pieceCID: output.data.cid, // Use the output-specific CID
          filename: `${project.title}_${output.description}.zip`,
        });

        if (!result.success) {
          throw new Error(result.error || "Download failed");
        }

        console.log(`Successfully downloaded: ${result.filename}`);
      } else if (output.data && output.data.url) {
        // Open HuggingFace URL in new tab
        window.open(output.data.url, "_blank");
      } else {
        throw new Error("No CID or HuggingFace URL found for this output");
      }
    } catch (err: any) {
      console.error("Download failed:", err);
      setDownloadError(err.message || "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadButtonText = () => {
    // Check for output-specific CID first
    if (output.data && output.data.cid && output.data.cid.trim()) {
      return "Download from Filecoin";
    } else if (output.data && output.data.url) {
      return "View on HuggingFace";
    }
    return "No Download Available";
  };

  const isDownloadAvailable = () => {
    return (
      (output.data && output.data.cid && output.data.cid.trim()) ||
      (output.data && output.data.url)
    );
  };

  return (
    <div className="bg-background dark:bg-background-dark-light/50 p-4 rounded-xl border border-border dark:border-border-dark space-y-3">
      {/* Error display */}
      {downloadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
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

      {/* Output header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-text dark:text-text-dark">
            {output.description}
          </h3>
          <ReproducibilityBadge status={reproducibilityStatus} />
        </div>
        <span className="text-xs bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light px-2 py-1 rounded-full">
          {output.type}
        </span>
      </div>

      {/* Metrics */}
      <div className="flex items-center space-x-4 text-sm text-text-secondary dark:text-text-dark-secondary">
        <span className="flex items-center space-x-1">
          <DownloadIcon className="w-4 h-4" />
          <span>{numberFormatter.format(output.metrics?.downloads || 0)}</span>
        </span>
        <span className="flex items-center space-x-1">
          <StarIcon className="w-4 h-4" />
          <span>{numberFormatter.format(output.metrics?.stars || 0)}</span>
        </span>
        <span className="flex items-center space-x-1">
          <BookOpenIcon className="w-4 h-4" />
          <span>{numberFormatter.format(output.metrics?.citations || 0)}</span>
        </span>
      </div>

      {/* Download button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDownload}
          disabled={!isDownloadAvailable() || isDownloading}
          className="flex items-center space-x-2 bg-primary text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StorageIcon className="w-4 h-4" />
          <span>
            {isDownloading ? "Downloading..." : getDownloadButtonText()}
          </span>
        </button>
      </div>

      {/* CID display if available */}
      {output.data && output.data.cid && (
        <div className="text-xs text-text-secondary dark:text-text-dark-secondary">
          CID:{" "}
          {output.data.cid.length > 20
            ? output.data.cid.substring(0, 20) + "..."
            : output.data.cid}
        </div>
      )}
    </div>
  );
};

export const ProjectDetailView = ({
  project,
  onBack,
  onPorSubmitClick,
  onViewReproducibility,
  onGetProofClick,
}: {
  project: Project;
  onBack: () => void;
  onPorSubmitClick: () => void;
  onViewReproducibility: (rep: Reproducibility) => void;
  onGetProofClick: (project: Project) => void;
}) => {
  const { currentUser } = useAppContext();
  const isOwner = currentUser
    ? project.ownerId === currentUser.walletAddress
    : false;
  const [isStarred, setIsStarred] = React.useState(false);

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-sm text-primary font-semibold mb-6 hover:underline"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        <span>{currentUser ? "Back to Dashboard" : "Back to Projects"}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Header */}
          <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Last updated: {project.lastOutputDate}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-text dark:text-text-dark">
                  {project.title}
                </h1>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-cairn-gray-200 dark:bg-cairn-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => setIsStarred((s) => !s)}
                  className={`p-2 rounded-full transition-colors ${
                    isStarred
                      ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20"
                      : "hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-800"
                  }`}
                >
                  {isStarred ? (
                    <StarFilledIcon className="w-5 h-5" />
                  ) : (
                    <StarIcon className="w-5 h-5" />
                  )}
                </button>
                <button className="p-2 rounded-full hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-800">
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
              {project.description}
            </p>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ImpactMetric
              icon={DownloadIcon}
              label="Total Downloads"
              value={numberFormatter.format(
                project.outputs.reduce(
                  (sum, o) => sum + (o.metrics?.downloads || 0),
                  0
                )
              )}
            />
            <ImpactMetric
              icon={StarIcon}
              label="Total Stars"
              value={numberFormatter.format(
                project.outputs.reduce(
                  (sum, o) => sum + (o.metrics?.stars || 0),
                  0
                )
              )}
            />
            <ImpactMetric
              icon={CitationIcon}
              label="Total Citations"
              value={numberFormatter.format(
                project.outputs.reduce(
                  (sum, o) => sum + (o.metrics?.citations || 0),
                  0
                )
              )}
            />
            <ImpactMetric
              icon={BeakerIcon}
              label="PoRs"
              value={project.reproducibilities.length}
            />
          </div>

          {/* Outputs Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Outputs</h2>
            </div>
            <div className="space-y-4">
              {project.outputs.map((output) => (
                <OutputCard
                  key={output.id}
                  output={output}
                  projectStatus={project.status}
                  project={project}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
          <FundingAndOwnershipWidget project={project} />
          <PoRModule
            project={project}
            isOwner={isOwner}
            onPorSubmitClick={onPorSubmitClick}
            onViewReproducibility={onViewReproducibility}
            onGetProofClick={() => onGetProofClick(project)}
          />
        </div>
      </div>
    </div>
  );
};
