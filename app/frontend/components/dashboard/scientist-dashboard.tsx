import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Project,
  ProjectStatus,
  UserProfile,
  Reproducibility,
  PoRStatus,
} from "../../lib/types";
import {
  PlusIcon,
  FileTextIcon,
  UploadCloudIcon,
  BeakerIcon,
  CheckCircleIcon,
  FlagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  GavelIcon,
  ChevronDownIcon,
  CloseIcon,
  HuggingFaceIcon,
  DownloadIcon,
  SearchIcon,
  ExternalLinkIcon,
  InfoIcon,
  CrossRedIcon,
} from "../ui/icons";
import { StatusBadge } from "../ui/status-badge";
import { useAppContext } from "../../context/app-provider";
import { Tooltip } from "../ui/tooltip";
import { OutputsLibrary } from "./outputs-library";
import { CreateProjectWizardModal } from "../modals/create-project-wizard-modal";
import { ConnectHuggingFaceModal } from "../modals/hugging-face-connection-modal";

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// --- Hugging Face Sync View ---

const HuggingFaceSyncView = ({
  onSelectProject,
  onOpenCreateProjectWizard,
}: {
  onSelectProject: (p: Project) => void;
  onOpenCreateProjectWizard: (outputs: any[]) => void;
}) => {
  const { projects, hfModels, hfDatasets } = useAppContext();
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null); // Changed from array to single value

  // Combine HF models and datasets into a unified display format
  const hfOutputsForDisplay = useMemo(() => {
    const modelsAsOutputs = hfModels.map((model) => ({
      id: model._id,
      name: model.id,
      type: "model" as const,
      downloads: model.downloads,
      likes: model.likes,
      lastModified: new Date(model.createdAt).toLocaleDateString(),
      status: projects.some(
        (p) =>
          p.huggingface?.repository_url === `https://huggingface.co/${model.id}`
      )
        ? "Imported"
        : "Not Imported",
      cairnProjectId: projects.find(
        (p) =>
          p.huggingface?.repository_url === `https://huggingface.co/${model.id}`
      )?._id,
      huggingfaceUrl: `https://huggingface.co/${model.id}`,
      tags: model.tags,
      isPrivate: model.private,
    }));

    const datasetsAsOutputs = hfDatasets.map((dataset) => ({
      id: dataset._id,
      name: dataset.id,
      type: "dataset" as const,
      downloads: dataset.downloads,
      likes: dataset.likes,
      lastModified: new Date(dataset.lastModified).toLocaleDateString(),
      status: projects.some(
        (p) =>
          p.huggingface?.repository_url ===
            `https://huggingface.co/datasets/${dataset.id}`
      )
        ? "Imported"
        : "Not Imported",
      cairnProjectId: projects.find(
        (p) =>
          p.huggingface?.repository_url ===
            `https://huggingface.co/datasets/${dataset.id}`
      )?._id,
      huggingfaceUrl: `https://huggingface.co/datasets/${dataset.id}`,
      tags: dataset.tags,
      isPrivate: dataset.private,
    }));

    return [...modelsAsOutputs, ...datasetsAsOutputs];
  }, [hfModels, hfDatasets, projects]);

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Not Imported" | "Imported"
  >("all");
  const [sortKey, setSortKey] = useState<
    "downloads" | "likes" | "lastModified"
  >("downloads");

  const filteredAndSortedOutputs = useMemo(() => {
    return hfOutputsForDisplay
      .filter((output) => {
        const searchMatch =
          searchTerm === "" ||
          output.name.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === "all" || output.type === typeFilter;
        const statusMatch =
          statusFilter === "all" || output.status === statusFilter;
        return searchMatch && typeMatch && statusMatch;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "likes":
            return b.likes - a.likes;
          case "lastModified":
            return (
              new Date(b.lastModified).getTime() -
              new Date(a.lastModified).getTime()
            );
          case "downloads":
          default:
            return b.downloads - a.downloads;
        }
      });
  }, [hfOutputsForDisplay, searchTerm, typeFilter, statusFilter, sortKey]);

  const handleSelectOne = (id: string) => {
    setSelectedOutputId((prev) => (prev === id ? null : id));
  };

  const handleOpenWizard = () => {
    if (!selectedOutputId) return;

    const selectedOutput = hfOutputsForDisplay.find(
      (o) => o.id === selectedOutputId
    );
    if (selectedOutput) {
      onOpenCreateProjectWizard([selectedOutput]); // Always pass array with single item
    }
  };

  const FilterChip = ({
    label,
    value,
    activeValue,
    setActiveValue,
  }: {
    label: string;
    value: any;
    activeValue: any;
    setActiveValue: (v: any) => void;
  }) => (
    <button
      onClick={() => setActiveValue(value)}
      className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
        activeValue === value
          ? "bg-primary text-white"
          : "bg-hf-gray-100 dark:bg-hf-gray-800/50 hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700"
      }`}
    >
      {label}
    </button>
  );

  const getStatusColor = (status: "Not Imported" | "Imported") => {
    switch (status) {
      case "Not Imported":
        return "bg-hf-gray-200 text-hf-gray-700 dark:bg-hf-gray-700 dark:text-hf-gray-200";
      case "Imported":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      default:
        return "bg-hf-gray-200 text-hf-gray-700 dark:bg-hf-gray-700 dark:text-hf-gray-200";
    }
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
          Potential Projects
        </h1>
        <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">
          These are your outputs from Hugging Face that can be imported as new
          projects on Cairn. Select one or more to begin.
        </p>
      </div>

      <div className="space-y-4 p-4 bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative lg:col-span-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
              Type:
            </span>
            <FilterChip
              label="All"
              value="all"
              activeValue={typeFilter}
              setActiveValue={setTypeFilter}
            />
            <FilterChip
              label="Models"
              value="model"
              activeValue={typeFilter}
              setActiveValue={setTypeFilter}
            />
            <FilterChip
              label="Datasets"
              value="dataset"
              activeValue={typeFilter}
              setActiveValue={setTypeFilter}
            />
            <FilterChip
              label="Spaces"
              value="space"
              activeValue={typeFilter}
              setActiveValue={setTypeFilter}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
              Status:
            </span>
            <FilterChip
              label="All"
              value="all"
              activeValue={statusFilter}
              setActiveValue={setStatusFilter}
            />
            <FilterChip
              label="Not Imported"
              value="Not Imported"
              activeValue={statusFilter}
              setActiveValue={setStatusFilter}
            />
            <FilterChip
              label="Imported"
              value="Imported"
              activeValue={statusFilter}
              setActiveValue={setStatusFilter}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="h-10 px-3 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="downloads">Sort by Most Downloads</option>
            <option value="likes">Sort by Most Likes</option>
            <option value="lastModified">Sort by Last Modified</option>
          </select>
          {selectedOutputId ? (
            <div className="flex items-center space-x-4 animate-fade-in">
              <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                <span className="bg-primary text-primary-text rounded-md px-2 py-0.5 mr-2">
                  1
                </span>
                selected
              </p>
              <button
                onClick={handleOpenWizard}
                className="font-semibold bg-primary text-primary-text hover:bg-primary-hover transition-colors px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Project</span>
              </button>
              <button
                onClick={() => setSelectedOutputId(null)}
                className="p-2 rounded-full hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700 text-text-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-primary-light"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-primary-light/70 dark:bg-primary/10 text-primary dark:text-primary-light animate-fade-in border border-primary/20">
              <InfoIcon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">
                Select one output to create a new project.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hf-gray-50 dark:bg-hf-gray-800/50 text-left text-xs text-text-secondary dark:text-text-dark-secondary uppercase">
              <tr>
                <th className="p-4 font-semibold tracking-wider">Name</th>
                <th className="p-4 font-semibold tracking-wider">Type</th>
                <th className="p-4 font-semibold tracking-wider text-right">
                  Downloads
                </th>
                <th className="p-4 font-semibold tracking-wider text-right">
                  Likes
                </th>
                <th className="p-4 font-semibold tracking-wider">
                  Last Modified
                </th>
                <th className="p-4 font-semibold tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {filteredAndSortedOutputs.map((output) => {
                const isImported = output.status !== "Not Imported";
                const isSelected = selectedOutputId === output.id;
                return (
                  <tr
                    key={output.id}
                    className={`${
                      isImported
                        ? "opacity-60"
                        : "hover:bg-hf-gray-50 dark:hover:bg-hf-gray-800/20"
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleSelectOne(output.id)}
                        disabled={isImported}
                        className="h-4 w-4 text-primary focus:ring-primary disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-4 font-semibold text-text-primary dark:text-dark-text-primary flex items-center space-x-2">
                      <span>{output.name}</span>
                      {output.huggingfaceUrl && (
                        <a
                          href={output.huggingfaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-primary"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                    <td className="p-4 capitalize">{output.type}</td>
                    <td className="p-4 text-right font-mono">
                      {numberFormatter.format(output.downloads)}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {numberFormatter.format(output.likes)}
                    </td>
                    <td className="p-4 text-text-secondary dark:text-dark-text-secondary">
                      {output.lastModified}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            if (output.cairnProjectId) {
                              const project = projects.find(
                                (p) => p.id === output.cairnProjectId
                              );
                              if (project) onSelectProject(project);
                            }
                          }}
                          disabled={output.status === "Not Imported"}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${getStatusColor(
                            output.status
                          )} ${
                            output.status !== "Not Imported"
                              ? "hover:brightness-90"
                              : ""
                          }`}
                        >
                          {output.status}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSortedOutputs.length === 0 && (
            <div className="text-center py-16 px-6">
              <p className="font-semibold text-text-primary dark:text-dark-text-primary">
                No outputs match your filters.
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Redesigned Dashboard Components ---

const KpiCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.FC<any>;
  title: string;
  value: string | number;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light p-5 rounded-xl border border-border/70 dark:border-border-dark/70 shadow-sm flex-grow">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-primary-light dark:bg-primary/10 rounded-lg">
        <Icon className="w-6 h-6 text-primary dark:text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
          {title}
        </p>
        <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ProjectCard = ({
  project,
  onSelectProject,
  onApplyClick,
  onSubmitForReproducibility,
}: {
  project: Project;
  onSelectProject: (p: Project) => void;
  onApplyClick: () => void;
  onSubmitForReproducibility: () => void;
}) => {
  const verifiedPors = !!project.por?.por_cid;

  const renderAction = () => {
    switch (project.project_status) {
      case "Draft":
      case "Pending Evaluation":
        return (
          <button
            disabled
            className="flex-1 bg-hf-gray-200 dark:bg-hf-gray-700 text-hf-gray-500 dark:text-hf-gray-400 font-semibold py-2 px-3 rounded-lg cursor-not-allowed transition-all duration-300 text-sm opacity-50"
          >
            Apply to Funding
          </button>
        );
      case "Evaluated":
        return (
          <button
            onClick={onApplyClick}
            className="flex-1 bg-primary-light text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-all duration-300 text-sm"
          >
            Apply to Funding
          </button>
        );
      case "Funded":
        return (
          <button className="flex-1 bg-primary-light text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-all duration-300 text-sm">
            View Round
          </button>
        );
      default:
        return (
          <button
            onClick={() => onSelectProject(project)}
            className="flex-1 bg-primary-light text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-all duration-300 text-sm"
          >
            Manage
          </button>
        );
    }
  };

  return (
    <div className="relative bg-background-light dark:bg-background-dark-light rounded-xl shadow-md border border-border dark:border-border-dark overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/70">
      {" "}
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary pr-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
            {project.title}
          </h3>
          <StatusBadge status={project.project_status} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs bg-hf-gray-100 dark:bg-hf-gray-800 px-2 py-0.5 rounded-full">
            {project.field}
          </span>
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm">
          <Tooltip text="Code on Filecoin">
            <div className="flex items-center space-x-2">
              <UploadCloudIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
              {project.huggingface?.repo_cid ? (
                <CheckCircleIcon className="w-4 h-4 text-status-success" />
              ) : (
                <CrossRedIcon className="w-4 h-4 text-status-error ml-1" />
              )}
            </div>
          </Tooltip>
          <Tooltip text="Verified PoR">
            <div className="flex items-center space-x-2">
              {verifiedPors ? (
                <CheckCircleIcon className="w-4 h-4 text-status-success ml-1" />
              ) : (
                <CrossRedIcon className="w-4 h-4 text-status-error ml-1" />
              )}

              <span className="font-semibold">PoR</span>
            </div>
          </Tooltip>
          <Tooltip text="Funding Raised">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
              <span className="font-semibold">
                {numberFormatter.format(project.funded_amount || 0)}
              </span>
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="border-t border-border dark:border-border-dark mt-auto p-3 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelectProject(project)}
          className="flex-1 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-hf-gray-300 dark:hover:bg-hf-gray-600 transition-all duration-300 text-sm"
        >
          View Project
        </button>
        {renderAction()}
      </div>
    </div>
  );
};

// --- New Funding Opportunities Dashboard ---

// FIX: Added missing helper functions and components for the FundingOpportunitiesDashboard.
// --- Helper Functions for FundingOpportunitiesDashboard ---
const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  const value = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
  if (isNaN(value)) return 0;

  if (amountStr.toUpperCase().includes("M")) {
    return value * 1_000_000;
  }
  if (amountStr.toUpperCase().includes("K")) {
    return value * 1_000;
  }
  return value;
};

const parseDeadline = (deadline: string): Date => {
  // This is a simple parser for "DD MMM" format
  const parts = deadline.split(" ");
  if (parts.length === 2) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = new Date().getFullYear();
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = monthMap[monthStr.substring(0, 3)];
    if (!isNaN(day) && month !== undefined) {
      return new Date(year, month, day);
    }
  }
  // Fallback for full date strings
  return new Date(deadline);
};

// --- Helper Components for FundingOpportunitiesDashboard ---
const FundingStatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.FC<any>;
  title: string;
  value: string | number;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light p-5 rounded-xl border border-border/70 dark:border-border-dark/70 shadow-sm">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-primary-light dark:bg-primary/10 rounded-lg">
        <Icon className="w-6 h-6 text-primary dark:text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
          {title}
        </p>
        <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const MyApplicationsWidget = ({
  applications,
}: {
  applications: {
    roundTitle: string;
    projectTitle: string;
    status: "Open" | "Voting" | "Closed";
    roundId: string;
  }[];
}) => (
  <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm">
    <h3 className="font-semibold mb-4 text-lg text-text-primary dark:text-dark-text-primary">
      My Applications
    </h3>
    {applications.length > 0 ? (
      <ul className="space-y-3">
        {applications.map((app, index) => (
          <li
            key={index}
            className="p-3 bg-hf-gray-50 dark:bg-hf-gray-900/70 rounded-lg"
          >
            <p className="font-semibold">{app.projectTitle}</p>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Applied to: {app.roundTitle}
            </p>
            <div className="mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Status: {app.status}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-center py-4 text-text-secondary dark:text-dark-text-secondary">
        You haven't applied to any rounds yet.
      </p>
    )}
  </div>
);

const ApplicationChecklistWidget = () => (
  <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm">
    <h3 className="font-semibold mb-4 text-lg text-text-primary dark:text-dark-text-primary">
      Application Checklist
    </h3>
    <ul className="space-y-2">
      <li className="flex items-center space-x-2 text-sm">
        <CheckBadgeIcon className="w-5 h-5 text-status-success" />
        <span>Project status is 'Reproducible'</span>
      </li>
      <li className="flex items-center space-x-2 text-sm">
        <FileTextIcon className="w-5 h-5 text-text-secondary" />
        <span>Clear and concise project description</span>
      </li>
      <li className="flex items-center space-x-2 text-sm">
        <BeakerIcon className="w-5 h-5 text-text-secondary" />
        <span>At least one verified PoR</span>
      </li>
      <li className="flex items-center space-x-2 text-sm">
        <CurrencyDollarIcon className="w-5 h-5 text-text-secondary" />
        <span>Well-defined use of funds</span>
      </li>
    </ul>
  </div>
);

const FundingOpportunitiesDashboard = ({
  projects,
  currentUser,
}: {
  projects: Project[];
  currentUser: UserProfile;
}) => {
  const { fundingRounds } = useAppContext();

  // Transform funding rounds into opportunities format
  const allOpportunities = useMemo(() => {
    return fundingRounds.map((round) => ({
      id: round.id,
      type: "Round" as const,
      title: round.title,
      issuer: "Cairn DAO", // Default issuer for funding rounds
      amount: `$${numberFormatter.format(round.poolSize)}`,
      poolSize: round.poolSize,
      deadline: new Date(round.applicationDeadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      tags: round.topics,
      isNew: false, // Could be calculated based on creation date
      url: `#/funding/${round.id}`, // Link to funding round details
      creationDate: new Date().toISOString(), // Would come from backend
    }));
  }, [fundingRounds]);

  // Extract all unique topics from funding rounds
  const allTopics = useMemo(() => {
    const topics = new Set(fundingRounds.flatMap((r) => r.topics));
    return Array.from(topics).sort();
  }, [fundingRounds]);

  // Applications data - would come from user's actual applications
  // TODO: Implement actual applications tracking when funding_round_id is added to Project schema
  const myApplications = useMemo(() => {
    // For now, return empty array until backend supports funding round applications
    // In the future, this would filter projects that have been applied to funding rounds
    const applications: {
      roundTitle: string;
      projectTitle: string;
      status: "Open" | "Voting" | "Closed";
      roundId: string;
    }[] = [];
    return applications;
  }, [projects, fundingRounds]);

  const [filterType, setFilterType] = useState("All");
  const [sortKey, setSortKey] = useState("deadline");
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        topicDropdownRef.current &&
        !topicDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTopicDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndSortedOpportunities = useMemo(() => {
    return allOpportunities
      .filter((opp) => {
        const typeMatch = filterType === "All" || opp.type === filterType;
        const topicMatch =
          activeTopics.length === 0 ||
          activeTopics.every((t) => opp.tags.includes(t));
        return typeMatch && topicMatch;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "deadline":
            return (
              parseDeadline(a.deadline).getTime() -
              parseDeadline(b.deadline).getTime()
            );
          case "pool":
            return b.poolSize - a.poolSize;
          case "recent":
            return (
              new Date(b.creationDate || 0).getTime() -
              new Date(a.creationDate || 0).getTime()
            );
          default:
            return 0;
        }
      });
  }, [allOpportunities, filterType, sortKey, activeTopics]);

  const kpis = {
    openRounds: fundingRounds.filter((r) => r.status === "Open").length,
    totalFunding: fundingRounds.filter((r) => r.status === "Open").reduce(
      (sum, r) => sum + r.poolSize,
      0
    ),
    myApplicationsCount: myApplications.length,
  };

  const handleToggleTopic = (topic: string) => {
    setActiveTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1 text-text-primary dark:text-dark-text-primary">
          Funding Opportunities
        </h1>
        <p className="text-text-secondary dark:text-dark-text-secondary">
          Discover grants, prizes, and funding rounds to support your research.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FundingStatCard
          icon={GavelIcon}
          title="Open Rounds"
          value={kpis.openRounds}
        />
        <FundingStatCard
          icon={CurrencyDollarIcon}
          title="Total Funding Available"
          value={`$${numberFormatter.format(kpis.totalFunding)}`}
        />
        <FundingStatCard
          icon={FileTextIcon}
          title="My Active Applications"
          value={kpis.myApplicationsCount}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm">
          <h3 className="font-semibold mb-4 text-lg text-text-primary dark:text-dark-text-primary">
            All Opportunities
          </h3>

          {/* Filter Controls */}
          <div className="pb-4 mb-4 border-b border-border dark:border-border-dark space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-2 bg-hf-gray-100 dark:bg-hf-gray-800/50 p-1 rounded-full">
                <button
                  onClick={() => setFilterType("All")}
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    filterType === "All"
                      ? "bg-white dark:bg-hf-gray-700 shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("Round")}
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    filterType === "Round"
                      ? "bg-white dark:bg-hf-gray-700 shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  Rounds
                </button>
                <button
                  onClick={() => setFilterType("Opportunity")}
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    filterType === "Opportunity"
                      ? "bg-white dark:bg-hf-gray-700 shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  Opportunities
                </button>
              </div>
              <div className="relative" ref={topicDropdownRef}>
                <button
                  onClick={() => setIsTopicDropdownOpen((p) => !p)}
                  className="flex items-center justify-between w-full sm:w-48 px-3 py-2 text-sm border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark"
                >
                  <span>Topics ({activeTopics.length})</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                {isTopicDropdownOpen && (
                  <div className="absolute z-20 w-56 mt-1 bg-background-light dark:bg-background-dark-light border border-border dark:border-border-dark rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {allTopics.map((topic) => (
                      <label
                        key={topic}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={activeTopics.includes(topic)}
                          onChange={() => handleToggleTopic(topic)}
                          className="h-4 w-4 mr-2 rounded text-primary focus:ring-primary border-hf-gray-300"
                        />
                        {topic}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="h-10 px-3 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-sm focus:ring-1 focus:ring-primary"
              >
                <option value="deadline">Sort by Deadline</option>
                <option value="pool">Sort by Pool Size</option>
                <option value="recent">Sort by Recently Added</option>
              </select>
            </div>
            {activeTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {activeTopics.map((topic) => (
                  <span
                    key={topic}
                    className="flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full"
                  >
                    {topic}
                    <button onClick={() => handleToggleTopic(topic)}>
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setActiveTopics([])}
                  className="text-xs font-semibold text-text-secondary hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredAndSortedOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-hf-gray-50 dark:bg-hf-gray-900/70 p-4 rounded-lg border border-border dark:border-border-dark"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
                      {opp.issuer}
                    </p>
                    <h4 className="font-bold text-text-primary dark:text-dark-text-primary">
                      {opp.title}
                    </h4>
                  </div>
                  {opp.isNew && (
                    <span className="text-xs bg-status-danger-bg text-status-danger font-semibold px-2 py-0.5 rounded-full dark:bg-status-danger-bg-dark dark:text-red-300">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-medium px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-border dark:border-border-dark">
                  <div>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                      Total Funding
                    </p>
                    <p className="font-semibold text-lg text-status-success">
                      {opp.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                      Deadline: {opp.deadline}
                    </p>
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 bg-primary text-white font-semibold py-1.5 px-4 rounded-lg hover:bg-primary-hover transition-colors text-sm"
                    >
                      {opp.type === "Round" ? "Apply Now" : "View Details"}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 space-y-8">
          <MyApplicationsWidget applications={myApplications} />
          <ApplicationChecklistWidget />
        </div>
      </div>
    </div>
  );
};

// --- Project Management View ---

const ProjectsView = ({
  myProjects,
  onSelectProject,
  onApplyToFunding,
  onSubmitForReproducibility,
}: {
  myProjects: Project[];
  onSelectProject: (p: Project) => void;
  onNavigate: (page: string) => void;
  onNewProject: () => void;
  onApplyToFunding: (project: Project) => void;
  onSubmitForReproducibility: (projectId: string) => void;
}) => {
  const sortedProjects = useMemo(() => {
    return [...myProjects].sort((a, b) => {
      const aIsFunded = a.status === ProjectStatus.Funded;
      const bIsFunded = b.status === ProjectStatus.Funded;
      if (aIsFunded === bIsFunded) {
        // If both have same funding status, sort by last output date
        return (
          new Date(b.lastOutputDate).getTime() -
          new Date(a.lastOutputDate).getTime()
        );
      }
      return aIsFunded ? 1 : -1; // Not funded projects first
    });
  }, [myProjects]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
            Registered Projects
          </h1>
          <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">
            Manage your existing projects on the CAIRN platform.
          </p>
        </div>
      </div>

      {/* Controls Bar - simplified for now */}
      <div className="p-4 bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name or tag..."
            className="w-full h-10 pl-10 pr-4 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark focus:ring-1 focus:ring-primary focus:border-primary text-sm"
          />
        </div>
        <select className="h-10 px-3 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-sm focus:ring-1 focus:ring-primary">
          <option>Filter by Status</option>
          {Object.values(ProjectStatus).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="h-10 px-3 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-sm focus:ring-1 focus:ring-primary">
          <option>Sort by Recently Updated</option>
          <option>Sort by Most Verified</option>
          <option>Sort by Most Funded</option>
        </select>
      </div>

      {/* Project Grid / Empty State */}
      {myProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onSelectProject={onSelectProject}
              onApplyClick={() => onApplyToFunding(p)}
              onSubmitForReproducibility={() =>
                onSubmitForReproducibility(p.id)
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-border dark:border-border-dark rounded-xl">
          <FileTextIcon className="mx-auto h-12 w-12 text-text-secondary/50" />
          <h3 className="mt-4 text-xl font-semibold">No projects yet</h3>
          <p className="text-text-secondary dark:text-text-dark-secondary mt-2">
            Import outputs from the "Potential Projects" section below to create
            a new project.
          </p>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export function ResearcherDashboard({
  projects,
  onSelectProject,
  onNewProject, // ← Add to destructured props
  currentUser,
  activePage,
  onNavigate,
  onApplyToFunding,
  onProjectCreated,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onNewProject: () => void; // ← Make sure it's in the type definition
  currentUser: UserProfile;
  activePage: string;
  onNavigate: (page: string) => void;
  onApplyToFunding: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
}) {
  const { handleSubmitForReproducibility, addToast } = useAppContext();

  // Add modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardOutputs, setWizardOutputs] = useState<[]>([]);
  const [isHFModalOpen, setIsHFModalOpen] = useState(false);

  // Handler for opening wizard with selected outputs
  const onOpenCreateProjectWizard = (outputs: []) => {
    setWizardOutputs(outputs);
    setIsWizardOpen(true);
  };

  const myProjects = useMemo(() => {
    if (!currentUser) return [];

    const userId = currentUser._id || currentUser.id; // Support both formats

    const filtered = projects.filter((p) => {
      // Handle both populated and non-populated researcher_id
      const researcherId =
        typeof p.researcher_id === "object" && p.researcher_id !== null
          ? p.researcher_id._id
          : p.researcher_id;

      return researcherId === userId;
    });

    return filtered;
  }, [projects, currentUser]);

  let content;

  if (activePage === "projects") {
    // Check if user has HuggingFace permissions
    const hasHuggingFacePermission =
      currentUser.integrations?.huggingface?.connected === true;

    content = (
      <div className="space-y-12">
        <ProjectsView
          myProjects={myProjects}
          onSelectProject={onSelectProject}
          onNavigate={onNavigate}
          onNewProject={onNewProject}
          onApplyToFunding={onApplyToFunding}
          onSubmitForReproducibility={handleSubmitForReproducibility}
        />

        {hasHuggingFacePermission ? (
          <HuggingFaceSyncView
            onSelectProject={onSelectProject}
            onOpenCreateProjectWizard={onOpenCreateProjectWizard}
          />
        ) : (
          <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-8 border border-border dark:border-border-dark text-center">
            <HuggingFaceIcon className="w-16 h-16 mx-auto mb-4 text-text-secondary dark:text-dark-text-secondary" />
            <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Connect Your Hugging Face Account
            </h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
              Link your Hugging Face account to import your models, datasets,
              and spaces directly into Cairn.
            </p>
            <button
              onClick={() => setIsHFModalOpen(true)}
              className="bg-primary text-primary-text font-semibold py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center space-x-2"
            >
              <HuggingFaceIcon className="w-5 h-5" />
              <span>Connect Hugging Face</span>
            </button>
          </div>
        )}
      </div>
    );
  } else if (activePage === "funding") {
    content = (
      <FundingOpportunitiesDashboard
        projects={projects}
        currentUser={currentUser}
      />
    );
  } else if (activePage === "outputs") {
    content = (
      <OutputsLibrary
        allProjects={projects}
        onSelectProject={onSelectProject}
      />
    );
  } else {
    content = (
      <OutputsLibrary
        allProjects={projects}
        onSelectProject={onSelectProject}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {content}

      {/* Existing wizard modal */}
      {isWizardOpen && (
        <CreateProjectWizardModal
          initialOutputs={wizardOutputs}
          onClose={() => setIsWizardOpen(false)}
          onProjectCreated={onProjectCreated}
        />
      )}

      {/* HuggingFace connection modal */}
      {isHFModalOpen && (
        <ConnectHuggingFaceModal onClose={() => setIsHFModalOpen(false)} />
      )}
    </div>
  );
}

import { GenerativePlaceholder } from "../ui/generative-placeholder";
import { ImpactLevelBadge } from "../ui/impact-level-badge";

const getImpactLevel = (fraction: number): "High" | "Medium" | "Low" => {
  if (fraction >= 0.75) return "High";
  if (fraction >= 0.3) return "Medium";
  return "Low";
};

const StatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.FC<any>;
  title: string;
  value: string | number;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light p-5 rounded-xl border border-border/70 dark:border-border-dark/70 shadow-sm">
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-blue-100 dark:bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
      </div>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
        {title}
      </p>
    </div>
    <p className="mt-2 text-3xl font-bold text-text dark:text-text-dark">
      {value}
    </p>
  </div>
);

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
      text: "Waiting: This submission is in a 5 minute dispute window. (7 days for production app)",
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

export function ScientistDashboard({
  onSelectProject,
  currentUser,
  activePage,
}: {
  onSelectProject: (p: Project) => void;
  onNewProject: () => void;
  currentUser: UserProfile;
  onViewContributionDetails: (
    reproducibility: Reproducibility,
    projectId: string
  ) => void;
  activePage: string;
}) {
  const { projects, setCurrentUser } = useAppContext();

  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "mostPors" | "leastPors"
  >("newest");


  const myProjects = useMemo(
    () =>
      projects.filter(
        (p) => p.researcher_id?._id === currentUser._id // Changed from ownerId
      ),
    [projects, currentUser._id] // Changed from walletAddress
  );

  React.useEffect(() => {
    // Count the number of PoRs contributed by the current user and update the user profile - setCurrentUser
    const totalPors = projects.reduce((count, project) => {
      return (
        count +
        project.reproducibilities.filter(
          (r) => r.recorder?.toLowerCase() === currentUser.walletAddress
        ).length
      );
    }, 0);
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        porContributedCount: totalPors,
        walletAddress: prev.walletAddress, // ensure required fields are present
        role: prev.role, // ensure required fields are present
      };
    });
  }, [myProjects, projects]);
  
  let content;

  if (activePage === "funding") {
    content = (
      <FundingOpportunitiesDashboard
        projects={projects}
        currentUser={currentUser}
      />
    );
  } else if (activePage === "outputs") {
    content = (
      <OutputsLibrary
        allProjects={projects}
        onSelectProject={onSelectProject}
      />
    );
  } else {
    content = (
      <OutputsLibrary
        allProjects={projects}
        onSelectProject={onSelectProject}
      />
    );
  }

  return <div className="animate-fade-in">{content}</div>;
}
