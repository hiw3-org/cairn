import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Project,
  ProjectStatus,
  UserProfile,
  Reproducibility,
  PoRStatus,
  HuggingFaceOutput,
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
  StarIcon,
  SearchIcon,
  ExternalLinkIcon,
  InfoIcon,
  EyeIcon,
  ChevronRightIcon,
} from "../ui/icons";
import { StatusBadge } from "../ui/status-badge";
import { useAppContext } from "../../context/app-provider";
import { Tooltip } from "../ui/tooltip";
import { OutputsLibrary } from "./outputs-library";

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
  onOpenCreateProjectWizard: (outputs: HuggingFaceOutput[]) => void;
}) => {
  const { projects, huggingFaceOutputs, setHuggingFaceOutputs } =
    useAppContext();
  const [selectedOutputIds, setSelectedOutputIds] = useState<string[]>([]);

  // This effect ensures that if a project status changes, the HF output status is updated.
  useEffect(() => {
    const projectStatusMap = new Map(projects.map((p) => [p.id, p.status]));
    setHuggingFaceOutputs((currentOutputs) =>
      currentOutputs.map((o) => {
        if (o.cairnProjectId) {
          const projectStatus = projectStatusMap.get(o.cairnProjectId);
          if (projectStatus) {
            let newStatus: HuggingFaceOutput["status"] = "Imported";
            if (projectStatus === ProjectStatus.PendingEvaluation)
              newStatus = "Pending Evaluation";
            else if (
              projectStatus === ProjectStatus.Reproducible ||
              projectStatus === ProjectStatus.Funded ||
              projectStatus === ProjectStatus.InReview
            )
              newStatus = "Reproducible";

            if (newStatus !== o.status) {
              return { ...o, status: newStatus };
            }
          }
        }
        return o;
      })
    );
  }, [projects, setHuggingFaceOutputs]);

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "model" | "dataset" | "space"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Imported" | "Not Imported" | "Pending Evaluation" | "Reproducible"
  >("all");
  const [sortKey, setSortKey] = useState<
    "downloads" | "likes" | "lastModified"
  >("downloads");

  const handleOpenWizard = () => {
    const selectedOutputs = huggingFaceOutputs.filter((o) =>
      selectedOutputIds.includes(o.id)
    );
    if (selectedOutputs.length > 0) {
      onOpenCreateProjectWizard(selectedOutputs);
    }
  };

  const filteredAndSortedOutputs = useMemo(() => {
    return huggingFaceOutputs
      .filter((o) => {
        const searchMatch =
          searchTerm === "" ||
          o.name.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === "all" || o.type === typeFilter;
        const statusMatch = statusFilter === "all" || o.status === statusFilter;
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
  }, [huggingFaceOutputs, searchTerm, typeFilter, statusFilter, sortKey]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOutputIds(
        filteredAndSortedOutputs
          .filter((o) => o.status === "Not Imported")
          .map((o) => o.id)
      );
    } else {
      setSelectedOutputIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOutputIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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

  const getStatusColor = (status: HuggingFaceOutput["status"]) => {
    switch (status) {
      case "Not Imported":
        return "bg-hf-gray-200 text-hf-gray-700 dark:bg-hf-gray-700 dark:text-hf-gray-200";
      case "Imported":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "Pending Evaluation":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "Reproducible":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
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
            <FilterChip
              label="Pending"
              value="Pending Evaluation"
              activeValue={statusFilter}
              setActiveValue={setStatusFilter}
            />
            <FilterChip
              label="Reproducible"
              value="Reproducible"
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
          {selectedOutputIds.length > 0 ? (
            <div className="flex items-center space-x-4 animate-fade-in">
              <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                <span className="bg-primary text-primary-text rounded-md px-2 py-0.5 mr-2">
                  {selectedOutputIds.length}
                </span>
                selected
              </p>
              <button
                onClick={handleOpenWizard}
                className="font-semibold bg-primary text-primary-text hover:bg-primary-hover transition-colors px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Project from Selected</span>
              </button>
              <button
                onClick={() => setSelectedOutputIds([])}
                className="p-2 rounded-full hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700 text-text-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-primary-light"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-primary-light/70 dark:bg-primary/10 text-primary dark:text-primary-light animate-fade-in border border-primary/20">
              <InfoIcon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">
                Select outputs using the checkboxes to create a new project.
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
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-hf-gray-400 text-primary focus:ring-primary"
                  />
                </th>
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
                        type="checkbox"
                        checked={selectedOutputIds.includes(output.id)}
                        onChange={() => handleSelectOne(output.id)}
                        disabled={isImported}
                        className="h-4 w-4 rounded border-hf-gray-400 text-primary focus:ring-primary disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-4 font-semibold text-text-primary dark:text-dark-text-primary flex items-center space-x-2">
                      <span>{output.name}</span>
                      <a
                        href={`https://huggingface.co/${output.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-primary"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </a>
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
  const verifiedPors = useMemo(
    () =>
      project.reproducibilities.filter((r) => r.status === PoRStatus.Success)
        .length,
    [project.reproducibilities]
  );

  const renderAction = () => {
    switch (project.status) {
      case ProjectStatus.Draft:
        return (
          <button
            onClick={onSubmitForReproducibility}
            disabled={project.outputs.length === 0}
            className="flex-1 bg-primary-light text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit for Reproducibility
          </button>
        );
      case ProjectStatus.Reproducible:
        return (
          <button
            onClick={onApplyClick}
            className="flex-1 bg-primary-light text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-all duration-300 text-sm"
          >
            Apply to Funding
          </button>
        );
      case ProjectStatus.Funded:
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
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-md border border-border dark:border-border-dark overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/70">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary pr-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
            {project.title}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-hf-gray-100 dark:bg-hf-gray-800 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm">
          <Tooltip text="Outputs Submitted">
            <div className="flex items-center space-x-2">
              <UploadCloudIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
              <span className="font-semibold">{project.outputs.length}</span>
            </div>
          </Tooltip>
          <Tooltip text="Verified PoRs">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
              <span className="font-semibold">{verifiedPors}</span>
            </div>
          </Tooltip>
          <Tooltip text="Funding Raised">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
              <span className="font-semibold">
                {numberFormatter.format(project.fundingPool)}
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
  
  //     title: o.title,
  //     issuer: o.issuer,
  //     amount: `${o.amount} ${o.currency}`,
  //     poolSize: parseAmount(o.amount),
  //     deadline: o.deadline,
  //     tags: [],
  //     isNew: o.isNew,
  //     url: o.url,
  //     creationDate: o.creationDate,
  //   }));

  //   const combined = [...rounds, ...opportunities];
  //   const topics = new Set(rounds.flatMap((r) => r.tags));

  //   return { allOpportunities: combined, allTopics: Array.from(topics).sort() };
  // }, []);

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

  // const myApplications = useMemo(() => {
  //   if (!currentUser) return [];
  //   const myProjectIds = new Set(
  //     projects
  //       .filter((p) => p.ownerId === currentUser.walletAddress)
  //       .map((p) => p.id)
  //   );
  //   return MOCK_FUNDING_ROUNDS.flatMap((round) =>
  //     (round.applicants || [])
  //       .filter((applicant) => myProjectIds.has(applicant.projectId))
  //       .map((applicant) => ({
  //         roundTitle: round.title,
  //         projectTitle: applicant.projectTitle,
  //         status: round.status,
  //         roundId: round.id,
  //       }))
  //   );
  // }, [projects, currentUser]);

  const kpis = {
    openRounds: MOCK_FUNDING_ROUNDS.filter((r) => r.status === "Open").length,
    totalFunding: MOCK_FUNDING_ROUNDS.filter((r) => r.status === "Open").reduce(
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

// --- New Project Management View ---

const ProjectsView = ({
  myProjects,
  onSelectProject,
  onNavigate,
  onNewProject,
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
  currentUser,
  activePage,
  onOpenCreateProjectWizard,
  onNavigate,
  onApplyToFunding,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onNewProject: () => void;
  currentUser: UserProfile;
  activePage: string;
  onOpenCreateProjectWizard: (outputs: HuggingFaceOutput[]) => void;
  onNavigate: (page: string) => void;
  onApplyToFunding: (project: Project) => void;
}) {
  const { handleSubmitForReproducibility } = useAppContext();
  const myProjects = useMemo(
    () => projects.filter((p) => p.ownerId === currentUser.walletAddress),
    [projects, currentUser.walletAddress]
  );

  let content;

  if (activePage === "projects") {
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
        <HuggingFaceSyncView
          onSelectProject={onSelectProject}
          onOpenCreateProjectWizard={onOpenCreateProjectWizard}
        />
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

  return <div className="animate-fade-in">{content}</div>;
}
import { StatusBadge } from "../ui/status-badge";
import { GenerativePlaceholder } from "../ui/generative-placeholder";
import { useAppContext } from "../../context/app-provider";
import { Tooltip } from "../ui/tooltip";
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

const DiscoverProjectCard = ({
  project,
  onSelectProject,
}: {
  project: Project;
  onSelectProject: (p: Project) => void;
}) => (
  <div
    onClick={() => onSelectProject(project)}
    className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-border dark:border-border-dark hover:border-primary/30 dark:hover:border-primary/70 overflow-hidden flex flex-col justify-between group"
  >
    {project.image_url ? (
      <img
        src={project.image_url}
        alt={project.title}
        className="w-full h-40 object-cover rounded-md"
      />
    ) : (
      <GenerativePlaceholder projectId={project.id} className="w-full h-40" />
    )}
    <div className="p-5 flex-grow">
      <h3 className="text-lg font-semibold text-text dark:text-text-dark group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
        {project.title}
      </h3>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
        {project.domain}
      </p>
      <p
        className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2 font-mono truncate"
        title={project.ownerId}
      >
        by: {project.ownerId}
      </p>
    </div>
    <div className="px-5 py-3 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 border-t border-border dark:border-border-dark flex justify-between items-center text-sm">
      <div className="flex items-center space-x-2 text-status-success font-medium">
        <CheckCircleIcon className="w-5 h-5" />
        <span>
          {project.reproducibilities.filter((r) => r.valid == true).length}{" "}
          Verified PoRs
        </span>
      </div>
      <span className="font-semibold text-primary dark:text-primary-light flex items-center">
        Review{" "}
        <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    </div>
  </div>
);

const MyProjectCard = ({
  project,
  onSelectProject,
}: {
  project: Project;
  onSelectProject: (p: Project) => void;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-md border border-border dark:border-border-dark overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/70">
    <div className="p-5 flex-grow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-text dark:text-text-dark pr-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
          {project.title}
        </h3>
        {/* <StatusBadge status={project.status} /> */}
      </div>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
        {project.domain}
      </p>

      <div className="mt-4 flex items-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <UploadCloudIcon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" />
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
            Output
          </span>
          {project.output[0] ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          ) : (
            <span title="No output uploaded">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <CheckIcon className="w-5 h-5 text-status-success" />
          <span className="font-semibold text-text dark:text-text-dark">
            {project.reproducibilities.length}
          </span>
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {" "}
            PoR Submissions
          </span>
        </div>
      </div>
    </div>
    <div className="border-t border-border dark:border-border-dark mt-auto p-4">
      <button
        onClick={() => onSelectProject(project)}
        className="w-full bg-primary text-primary-text font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-all duration-300 text-sm shadow-md hover:shadow-lg"
      >
        {project.status === ProjectStatus.Draft ? "Manage" : "View Project"}
      </button>
    </div>
  </div>
);

const NewProjectCard = ({
  onNewProject,
  isEligible,
  porRequirement,
  porContributedCount,
}: {
  onNewProject: () => void;
  isEligible: boolean;
  porRequirement: number;
  porContributedCount: number;
}) => (
  <div className="relative group h-full">
    <button
      onClick={onNewProject}
      disabled={!isEligible}
      className="w-full h-full bg-background-light dark:bg-background-dark-light rounded-xl border-2 border-dashed border-border dark:border-border-dark flex flex-col items-center justify-center p-5 text-text-secondary hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary-light transition-all duration-300 disabled:cursor-not-allowed disabled:hover:border-border dark:disabled:hover:border-border-dark disabled:hover:text-text-secondary min-h-[220px]"
    >
      <PlusIcon className="w-10 h-10 mb-3" />
      <span className="font-semibold text-lg">New Project</span>
    </button>
    {!isEligible && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs text-center px-3 py-1.5 bg-text text-background-light dark:bg-text-dark dark:text-background-dark text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {`Need ${
          porRequirement - porContributedCount
        } more PoRs to create a project (${porRequirement} total).`}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-text dark:border-t-text-dark"></div>
      </div>
    )}
  </div>
);

const ActionRequiredWidget = ({
  projects,
  onSelectProject,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
}) => {
  const projectsNeedingOutputs = useMemo(
    () => projects.filter((p) => p.output.length === 0),
    [projects]
  );

  const actionItems = useMemo(() => {
    return projectsNeedingOutputs.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [projectsNeedingOutputs]);

  const ActionStatCard = ({
    icon: Icon,
    iconClass,
    count,
    label,
    tooltipText,
  }: {
    icon: React.FC<any>;
    iconClass: string;
    count: number;
    label: string;
    tooltipText: string;
  }) => (
    <div className="bg-cairn-gray-100 dark:bg-cairn-gray-900 p-4 rounded-xl flex items-center space-x-4 transition-colors hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-800">
      <Icon className={`w-8 h-8 flex-shrink-0 ${iconClass}`} />
      <div>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-text dark:text-text-dark">
            {count}
          </p>
          <span className="text-base font-medium text-text-secondary dark:text-text-dark-secondary">
            {count === 1 ? "Project" : "Projects"}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5">
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {label}
          </p>
          <Tooltip text={tooltipText}>
            <InfoIcon className="w-4 h-4 text-text-secondary/70 dark:text-text-dark-secondary/70 cursor-help" />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-5 border border-border dark:border-border-dark shadow-sm flex flex-col h-80">
      <h4 className="font-semibold mb-4 text-text dark:text-text-dark shrink-0">
        Action Required
      </h4>

      <div className="grid grid-cols-1 gap-4 shrink-0">
        <ActionStatCard
          icon={UploadCloudIcon}
          iconClass="text-primary"
          count={projectsNeedingOutputs.length}
          label="Need Outputs"
          tooltipText="Research outputs are the core assets of your project. Upload anything that others can build on or verify—like code, datasets, simulations, or experimental results."
        />
      </div>

      {actionItems.length > 0 ? (
        <>
          <div className="my-4 border-t border-border dark:border-border-dark -mx-5 px-5 shrink-0"></div>
          <div className="flex-grow min-h-0 overflow-y-auto -mr-2 pr-2">
            <ul className="space-y-2">
              {actionItems.map((p) => {
                const reason = "Add research outputs to activate";

                return (
                  <li
                    key={p.id}
                    className="flex justify-between items-center p-3 rounded-lg transition-colors bg-primary-light/70 dark:bg-primary/10"
                  >
                    <div>
                      <p className="font-semibold text-sm text-text dark:text-text-dark">
                        {p.title}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        {reason}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectProject(p)}
                      className="text-xs font-semibold py-1 px-3 rounded-full transition-colors hover:opacity-80 bg-primary-light text-primary"
                    >
                      Manage
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
          <CheckCircleIcon className="mx-auto h-10 w-10 text-status-success" />
          <p className="mt-3 text-sm font-medium text-text dark:text-text-dark">
            No immediate actions required.
          </p>
          <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
            All your active projects are up-to-date.
          </p>
        </div>
      )}
    </div>
  );
};

const DisputesWidget = ({
  projects,
  currentUser,
  onViewContributionDetails,
}: {
  projects: Project[];
  currentUser: UserProfile;
  onViewContributionDetails: (
    reproducibility: Reproducibility,
    projectId: string
  ) => void;
}) => {
  const myDisputedPors = useMemo(() => {
    return projects.flatMap((p) =>
      p.reproducibilities
        .filter(
          (r) =>
            r.verifier === currentUser.walletAddress &&
            r.status === PoRStatus.Disputed
        )
        .map((r) => ({ ...r, projectTitle: p.title, projectId: p.id }))
    );
  }, [projects, currentUser.walletAddress]);

  const ActionStatCard = ({
    icon: Icon,
    iconClass,
    count,
    label,
    tooltipText,
  }: {
    icon: React.FC<any>;
    iconClass: string;
    count: number;
    label: string;
    tooltipText: string;
  }) => (
    <div className="bg-cairn-gray-100 dark:bg-cairn-gray-900 p-4 rounded-xl flex items-center space-x-4 transition-colors hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-800">
      <Icon className={`w-8 h-8 flex-shrink-0 ${iconClass}`} />
      <div>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-text dark:text-text-dark">
            {count}
          </p>
          <span className="text-base font-medium text-text-secondary dark:text-text-dark-secondary">
            {count === 1 ? "Dispute" : "Disputes"}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5">
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {label}
          </p>
          <Tooltip text={tooltipText}>
            <InfoIcon className="w-4 h-4 text-text-secondary/70 dark:text-text-dark-secondary/70 cursor-help" />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-5 border border-border dark:border-border-dark shadow-sm h-full flex flex-col">
      <h4 className="font-semibold mb-4 text-text dark:text-text-dark flex-shrink-0">
        My Proof Disputes
      </h4>

      <div className="grid grid-cols-1 gap-4 flex-shrink-0">
        <ActionStatCard
          icon={FlagIcon}
          iconClass="text-status-danger"
          count={myDisputedPors.length}
          label="On my PoRs"
          tooltipText="These are Proof of Reproducibility submissions you made that have been disputed by the community. Review the project and dispute details."
        />
      </div>

      {myDisputedPors.length > 0 ? (
        <>
          <div className="my-4 border-t border-border dark:border-border-dark -mx-5 px-5"></div>
          <div className="flex-grow overflow-y-auto -mr-2 pr-2">
            <ul className="space-y-2">
              {myDisputedPors.map((r) => {
                return (
                  <li
                    key={r.id}
                    className="flex justify-between items-center p-3 rounded-lg transition-colors bg-status-danger-bg dark:bg-status-danger-bg-dark/50"
                  >
                    <div>
                      <p className="font-semibold text-sm text-text dark:text-text-dark">
                        PoR on: {r.projectTitle}
                      </p>
                      <p className="text-xs font-semibold text-status-danger">
                        Your submission was disputed
                      </p>
                    </div>
                    <button
                      onClick={() => onViewContributionDetails(r, r.projectId)}
                      className="text-xs font-semibold py-1 px-3 rounded-full transition-colors hover:opacity-80 bg-status-danger-bg text-status-danger dark:bg-status-danger-bg-dark dark:text-red-300"
                    >
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
          <CheckCircleIcon className="mx-auto h-10 w-10 text-status-success" />
          <p className="mt-3 text-sm font-medium text-text dark:text-text-dark">
            No disputes on your submissions.
          </p>
          <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
            All your contributions are in good standing.
          </p>
        </div>
      )}
    </div>
  );
};

const ActivityFeedWidget = ({
  projects,
  onViewReview,
}: {
  projects: Project[];
  onViewReview: (reproducibility: Reproducibility, projectId: string) => void;
}) => {
  const recentSubmissions = useMemo(() => {
    return projects
      .flatMap((p) =>
        p.reproducibilities.map((r) => ({
          ...r,
          projectTitle: p.title,
          projectId: p.id,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);
  }, [projects]);

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm flex flex-col h-80">
      <h4 className="font-semibold mb-6 text-text dark:text-text-dark text-lg shrink-0">
        Activity Feed
      </h4>
      {recentSubmissions.length > 0 ? (
        <div className="flex-grow min-h-0 overflow-y-auto -mr-3 pr-3">
          <ul className="relative border-l border-border dark:border-border-dark ml-3">
            {recentSubmissions.map((r) => {
              return (
                <li key={r.proof_id} className="relative pl-8 pb-6 last:pb-0">
                  <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary transform -translate-x-1/2 ring-4 ring-background-light dark:ring-background-dark-light"></div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="text-sm flex-grow">
                      <p className="text-text dark:text-text-dark leading-relaxed">
                        <span
                          className="font-semibold text-primary font-mono"
                          title={r.recorder}
                        >
                          {r.recorder.substring(0, 8)}...
                        </span>
                        {" submitted a PoR for "}
                        <span className="font-semibold">{r.projectTitle}</span>.
                      </p>
                      <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
                        {new Date(
                          Number(r.timestamp) * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => onViewReview(r, r.projectId)}
                      className="text-xs bg-primary-light text-primary font-semibold py-1 px-3 rounded-full hover:bg-blue-200/50 transition-colors flex-shrink-0"
                    >
                      View
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
          <SearchIcon className="mx-auto h-8 w-8 text-text-secondary" />
          <p className="mt-3 text-sm font-medium text-text dark:text-text-dark">
            No recent activity.
          </p>
          <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
            Reproducibility submissions will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

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

const ReproducibilityHistoryWidget = ({
  projects,
  currentUser,
  onViewContributionDetails,
}: {
  projects: Project[];
  currentUser: UserProfile;
  onViewContributionDetails: (
    reproducibility: Reproducibility,
    projectId: string
  ) => void;
}) => {
  const myContributions = useMemo(() => {
    console.log("Projects in widget:", projects);
    return projects
      .flatMap((p) =>
        p.reproducibilities
          .filter(
            (r) => r.recorder?.toLowerCase() === currentUser.walletAddress
          )
          .map((r) => ({ ...r, projectTitle: p.title, projectId: p.id }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [projects, currentUser.walletAddress]);

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-5 border border-border dark:border-border-dark shadow-sm">
      {myContributions.length > 0 ? (
        <div className="max-h-96 overflow-y-auto">
          <ul className="space-y-2 pr-2">
            {myContributions.map((r) => (
              <li
                key={r.proof_id}
                className="flex justify-between items-center bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg"
              >
                <div className="flex-grow pr-4">
                  <p className="font-semibold text-sm truncate text-text dark:text-text-dark">
                    On: {r.projectTitle}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                    {new Date(r.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <PoRStatusBadge rep={r} />
                  <button
                    onClick={() => onViewContributionDetails(r, r.projectId)}
                    className="text-xs bg-primary-light text-primary font-semibold py-1 px-3 rounded-full hover:bg-blue-200/50 transition-colors"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <BeakerIcon className="mx-auto h-8 w-8 text-text-secondary" />
          <p className="mt-3 text-sm font-medium text-text dark:text-text-dark">
            No contributions yet.
          </p>
          <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
            Review projects in the Discover tab to contribute.
          </p>
        </div>
      )}
    </div>
  );
};

const MyMetricsWidget = ({
  currentUser,
  totalPorsContributed,
  porRequirement,
}: {
  currentUser: UserProfile;
  totalPorsContributed: number;
  porRequirement: number;
}) => {
  return (
    <div className="bg-background-light dark:bg-background-dark-light p-6 rounded-xl border border-border dark:border-border-dark flex flex-col h-full">
      <h4 className="font-semibold mb-4 text-text dark:text-text-dark flex-shrink-0">
        My Contributions
      </h4>
      <div className="flex flex-col space-y-6 flex-grow justify-center">
        {/* Metric 1: New Project Quota */}
        <div className="flex items-start space-x-4">
          <div className="bg-primary-light dark:bg-primary/20 p-3 rounded-lg flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-primary dark:text-primary-light" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-text dark:text-text-dark">{`${currentUser.porContributedCount} / ${porRequirement}`}</p>
              <div className="flex items-center space-x-1.5">
                <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
                  PoR Quota
                </p>
                <Tooltip text="Review projects and submit enough Proof Of Reproducibility to create new projects. Made 1 only for this hackathon demo. Should be 3 in production.">
                  <InfoIcon className="w-4 h-4 text-text-secondary/70 dark:text-text-dark-secondary/70 cursor-help" />
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        {/* Metric 2: Total PoRs Submitted */}
        <div className="flex items-start space-x-4">
          <div className="bg-primary-light dark:bg-primary/20 p-3 rounded-lg flex items-center justify-center">
            <BeakerIcon className="w-6 h-6 text-primary dark:text-primary-light" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-text dark:text-text-dark">
                {totalPorsContributed}
              </p>
              <div className="flex items-center space-x-1.5">
                <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
                  Number of PoR Submitted
                </p>
                <Tooltip text="Total amount of your contributions on this platform.">
                  <InfoIcon className="w-4 h-4 text-text-secondary/70 dark:text-text-dark-secondary/70 cursor-help" />
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactOpportunitiesWidget = () => {
  const opportunities = [
    {
      id: "opp-1",
      issuer: "Schmidt Futures",
      amount: "2.0M",
      currency: "USD",
      title: "AI for Climate Science Initiative",
      deadline: "15 Aug",
      isNew: true,
      url: "https://www.schmidtfutures.com/",
    },
    {
      id: "opp-2",
      issuer: "Wellcome Trust",
      amount: "500K",
      currency: "GBP",
      title: "Global Health Innovation Grant",
      deadline: "30 Sep",
      isNew: true,
      url: "https://wellcome.org/",
    },
    {
      id: "opp-3",
      issuer: "NSF Program",
      amount: "100K",
      currency: "USD",
      title: "Trustworthy AI Systems Program",
      deadline: "01 Nov",
      isNew: false,
      url: "https://www.nsf.gov/",
    },
  ];

  const newCount = opportunities.filter((op) => op.isNew).length;

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-5 border border-border dark:border-border-dark shadow-sm flex flex-col h-80">
      <h4 className="font-semibold mb-4 text-text dark:text-text-dark shrink-0 flex items-center">
        <LightbulbIcon className="w-5 h-5 mr-2 text-primary" />
        <span className="mr-1.5">Impact Opportunities</span>
        <Tooltip text="Announcements of funding opportunities and prizes for specific research initiatives aimed at creating impact.">
          <InfoIcon className="w-4 h-4 text-text-secondary/70 dark:text-text-dark-secondary/70 cursor-help" />
        </Tooltip>
        {newCount > 0 && (
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-status-danger text-white text-xs font-bold">
            {newCount}
          </span>
        )}
      </h4>
      <div className="flex-grow min-h-0 overflow-y-auto -mr-2 pr-2">
        <ul className="space-y-3">
          {opportunities.map((opp) => (
            <li
              key={opp.id}
              className="bg-cairn-gray-50 dark:bg-cairn-gray-900/70 p-4 rounded-lg border border-border dark:border-border-dark"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-text dark:text-text-dark">
                    {opp.issuer}
                  </p>
                  <p className="text-xs font-semibold text-status-success">
                    {opp.amount}{" "}
                    <span className="text-green-400 dark:text-green-500">
                      {opp.currency} total funding
                    </span>
                  </p>
                </div>
                {opp.isNew && (
                  <span className="text-xs bg-status-danger-bg text-status-danger font-semibold px-2 py-0.5 rounded-full dark:bg-status-danger-bg-dark dark:text-red-300">
                    New
                  </span>
                )}
              </div>
              <h5 className="font-semibold my-3 text-text dark:text-text-dark">
                {opp.title}
              </h5>
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                  Deadline: {opp.deadline}
                </p>
                <a
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-light text-primary font-semibold py-1.5 px-4 rounded-lg hover:bg-blue-200/50 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-colors text-xs"
                >
                  Details
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FundingDashboard = ({
  projects,
  onSelectProject,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
}) => {
  const { fundingHistory } = useAppContext();
  const totalRaised = useMemo(
    () =>
      projects
        .filter(
          (p) =>
            p.status === ProjectStatus.Active ||
            p.status === ProjectStatus.Funded
        )
        .reduce((sum, p) => sum + p.fundingPool, 0),
    [projects]
  );
  const activeProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.status === ProjectStatus.Active || p.status === ProjectStatus.Funded
      ).length,
    [projects]
  );
  const numberFormatter = new Intl.NumberFormat("de-DE");

  const projectsForTable = useMemo(
    () =>
      projects
        .filter(
          (p) =>
            p.status === ProjectStatus.Funded ||
            p.status === ProjectStatus.Active
        )
        .sort((a, b) => b.fundingPool - a.fundingPool),
    [projects]
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-1 text-text dark:text-text-dark">
          My Funding Metrics
        </h1>
        <p className="text-text-secondary dark:text-text-dark-secondary">
          Track the financial health and impact of your research portfolio.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={DownloadIcon}
          title="Total Raised"
          value={`$${numberFormatter.format(totalRaised)}`}
        />
        <StatCard
          icon={FileTextIcon}
          title="Active/Funded Projects"
          value={activeProjects}
        />
      </div>
      <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm">
        <h3 className="font-semibold mb-4 text-lg text-text dark:text-text-dark">
          Funding Details by Project
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary dark:text-text-dark-secondary uppercase bg-cairn-gray-50 dark:bg-cairn-gray-800/50">
              <tr>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">First Funded</th>
                <th className="p-4 font-semibold">Total Funds</th>
                <th className="p-4 font-semibold">Funders</th>
                <th className="p-4 font-semibold">Tx Hashes</th>
                <th className="p-4 font-semibold">Impact Level</th>
                <th className="p-4 font-semibold text-center">Impact Cert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {projectsForTable.map((p) => {
                const projectFundingEvents = fundingHistory.filter(
                  (f) => f.projectId === p.id
                );
                const firstFundedDate =
                  projectFundingEvents.length > 0
                    ? new Date(
                        projectFundingEvents.reduce((oldest, current) =>
                          new Date(current.timestamp) <
                          new Date(oldest.timestamp)
                            ? current
                            : oldest
                        ).timestamp
                      ).toLocaleDateString("de-DE")
                    : "N/A";
                const totalFunds = p.fundingPool;
                const funders = [
                  ...new Set(projectFundingEvents.map((f) => f.funderWallet)),
                ];
                const txHashes = projectFundingEvents.map((f) => f.txHash);
                const impactLevel = getImpactLevel(p.hypercertFraction);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className="hover:bg-cairn-gray-50 dark:hover:bg-cairn-gray-800/20 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-semibold text-text dark:text-text-dark">
                      {p.title}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-4 font-mono text-text-secondary dark:text-text-dark-secondary">
                      {firstFundedDate}
                    </td>
                    <td className="p-4 font-mono font-bold text-status-success">
                      ${numberFormatter.format(totalFunds)}
                    </td>
                    <td className="p-4">
                      {funders.length > 0 ? (
                        <div className="flex items-center -space-x-3 overflow-hidden">
                          {funders.slice(0, 3).map((wallet) => {
                            return (
                              <div
                                key={wallet}
                                title={wallet}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-background-light dark:ring-background-dark-light bg-cairn-gray-300 dark:bg-cairn-gray-600 flex items-center justify-center text-xs font-bold text-cairn-gray-800 dark:text-cairn-gray-200"
                              >
                                {wallet.substring(2, 4).toUpperCase()}
                              </div>
                            );
                          })}
                          {funders.length > 3 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background-light dark:ring-background-dark-light bg-cairn-gray-400 dark:bg-cairn-gray-500 flex items-center justify-center text-xs font-bold text-white">
                              +{funders.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary dark:text-text-dark-secondary">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {txHashes.length > 0 ? (
                        <div className="flex flex-col space-y-1 items-start">
                          {txHashes.slice(0, 2).map((hash) => (
                            <a
                              key={hash}
                              href="#"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline"
                              title={hash}
                            >
                              {hash.substring(0, 8)}...
                            </a>
                          ))}
                          {txHashes.length > 2 && (
                            <span className="text-xs text-text-secondary">
                              ...and {txHashes.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary dark:text-text-dark-secondary">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <ImpactLevelBadge level={impactLevel} />
                    </td>
                    <td className="p-4 text-center">
                      {p.status !== ProjectStatus.Draft &&
                      p.hypercertFraction > 0 ? (
                        <button
                          className="text-primary hover:text-blue-400"
                          title={`View Impact Certificate (${(
                            p.hypercertFraction * 100
                          ).toFixed(0)}%)`}
                        >
                          <FileTextIcon className="w-6 h-6" />
                        </button>
                      ) : (
                        <span className="text-text-secondary dark:text-text-dark-secondary">
                          N/A
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {projectsForTable.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center p-6 text-text-secondary dark:text-text-dark-secondary"
                  >
                    You have no active or funded projects to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div>
    <h1 className="text-3xl font-bold text-text dark:text-text-dark">
      {title}
    </h1>
    <p className="mt-1 text-text-secondary dark:text-text-dark-secondary">
      {subtitle}
    </p>
  </div>
);

export function ScientistDashboard({
  onSelectProject,
  onNewProject,
  currentUser,
  onViewContributionDetails,
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

  const porRequirement = 1;
  const isEligibleToCreate = currentUser.porContributedCount >= porRequirement;

  const myProjects = useMemo(
    () =>
      projects.filter(
        (p) => p.ownerId?.toLowerCase() === currentUser.walletAddress
      ),
    [projects, currentUser.walletAddress]
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

  const totalPorsContributed = useMemo(() => {
    return projects.reduce((count, project) => {
      return (
        count +
        project.reproducibilities.filter(
          (r) => r.verifier === currentUser.walletAddress
        ).length
      );
    }, 0);
  }, [projects, currentUser.walletAddress]);

  const discoverProjects = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.ownerId !== currentUser.walletAddress
    );

    return [...activeProjects].sort((a, b) => {
      switch (sortOrder) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "mostPors":
          return b.reproducibilities.length - a.reproducibilities.length;
        case "leastPors":
          return a.reproducibilities.length - b.reproducibilities.length;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [projects, currentUser.walletAddress, sortOrder]);

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
