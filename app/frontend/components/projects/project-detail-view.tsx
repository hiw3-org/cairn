"use client";

import {
  Project,
  Reproducibility,
  Output,
  ProjectStatus,
  ReproducibilityStatus,
} from "../../lib/types";
import { downloadFromFileCoin } from "../../utils/filecoin";
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

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const AddressWithCopy = ({ address }: { address: string }) => {
  const { copy, copied } = useClipboard();
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex items-center space-x-2 group">
      <span
        className="font-mono text-sm text-text-secondary dark:text-text-dark-secondary"
        title={address}
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

const ProjectResourceCard = ({
  title,
  url,
  type,
  project,
}: {
  title: string;
  url?: string;
  type: string;
  project: Project;
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const reproducibilityStatus: ReproducibilityStatus =
    project.por_status === "Phase2" ? "Verified" : "Pending";

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      // Check if we should download from Filecoin
      const hasCid =
        (type === "HuggingFace" && project.huggingface?.contents_cid) ||
        project.por?.por_cid;

      if (hasCid) {
        const walletAddress = import.meta.env.VITE_FILECOIN_WALLET_ADDRESS;
        if (
          !walletAddress ||
          typeof walletAddress !== "string" ||
          walletAddress.trim() === ""
        ) {
          throw new Error(
            "Missing required environment variable: VITE_FILECOIN_WALLET_ADDRESS"
          );
        }

        const cidToUse =
          type === "HuggingFace"
            ? project.huggingface?.contents_cid
            : project.por?.por_cid;

        const result = await downloadFromFileCoin({
          walletAddress,
          pieceCID: cidToUse!,
          filename: `${project.title}_${type}.zip`,
        });

        if (!result.success) {
          throw new Error(result.error || "Download failed");
        }

        console.log(`Successfully downloaded: ${result.filename}`);
      } else if (url) {
        // Open URL in new tab for direct links
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("No CID or URL found for this resource");
      }
    } catch (err: any) {
      console.error("Download failed:", err);
      setDownloadError(err.message || "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadButtonText = () => {
    let hasCid = false;
    if (type === "HuggingFace" && project.huggingface?.contents_cid) {
      hasCid = true;
    } else if (project.por?.por_cid) {
      hasCid = true;
    }

    if (hasCid) {
      return "Download from Filecoin";
    } else if (url) {
      return type === "HuggingFace" ? "View on HuggingFace" : "View on ArXiv";
    }
    return "No Download Available";
  };

  const isDownloadAvailable = () => {
    const hasCid =
      (type === "HuggingFace" && project.huggingface?.contents_cid) ||
      project.por?.por_cid;
    return hasCid || url;
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

      {/* Resource header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-text dark:text-text-dark">
            {title}
          </h3>
          {/* <ReproducibilityBadge status={reproducibilityStatus} /> */}
        </div>
        <span className="text-xs bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light px-2 py-1 rounded-full">
          {type}
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
      {((type === "HuggingFace" && project.huggingface?.contents_cid) ||
        project.por?.por_cid) && (
        <div className="text-xs text-text-secondary dark:text-text-dark-secondary">
          CID:{" "}
          {(() => {
            const cid =
              type === "HuggingFace" && project.huggingface?.contents_cid
                ? project.huggingface.contents_cid
                : project.por?.por_cid || "";
            return cid.length > 20 ? cid.substring(0, 20) + "..." : cid;
          })()}
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
    ? project.researcher_id === currentUser._id
    : false;
  const [isStarred, setIsStarred] = React.useState(false);

  // Create resource cards from project data
  const projectResources = React.useMemo(() => {
    const resources = [];

    // Add HuggingFace resource if available
    if (project.huggingface?.repository_url) {
      resources.push({
        title: `${project.title} - HuggingFace Repository`,
        url: project.huggingface.repository_url,
        type: "HuggingFace",
      });
    }

    // Add paper resource if available
    if (project?.publication_url) {
      const paperUrl = project.publication_url;

      resources.push({
        title: project.description || `${project.title} - Research Paper`,
        url: paperUrl,
        type: "ArXiv Paper",
      });
    }

    return resources;
  }, [project]);

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
                  <StatusBadge status={project.project_status} />
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Last updated:{" "}
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-text dark:text-text-dark">
                  {project.title}
                </h1>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs bg-cairn-gray-200 dark:bg-cairn-gray-700 px-2 py-0.5 rounded-full">
                    {project.field}
                  </span>
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
              {project.description ||
                project.paper?.abstract ||
                "No description available"}
            </p>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ImpactMetric
              icon={DownloadIcon}
              label="Funding"
              value={`${(project.funded_amount || 0).toLocaleString()}`}
            />
            <ImpactMetric
              icon={StarIcon}
              label="Field"
              value={project.field || "Unknown"}
            />
            <ImpactMetric
              icon={CitationIcon}
              label="Status"
              value={project.project_status || "Unknown"}
            />
            <ImpactMetric
              icon={BeakerIcon}
              label="PoR Status"
              value={project.por_status || "Unknown"}
            />
          </div>

          {/* Resources Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Resources</h2>
            </div>
            <div className="space-y-4">
              {projectResources.length > 0 ? (
                projectResources.map((resource, index) => (
                  <ProjectResourceCard
                    key={index}
                    title={resource.title}
                    url={resource.url}
                    type={resource.type}
                    project={project}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary dark:text-text-dark-secondary">
                  No resources available for this project
                </div>
              )}
            </div>
          </div>
        </div> 
      </div>
    </div>
  );
};
