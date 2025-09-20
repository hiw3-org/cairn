"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Project,
  LibraryOutput,
  LibraryOutputType,
  ReproducibilityStatus,
  ProjectStatus,
} from "../../lib/types";
import { MOCK_USERS } from "../../lib/constants";
import { useApi } from "../../context/api-context";
import {
  SearchIcon,
  ChevronDownIcon,
  DownloadIcon,
  StarIcon,
  BookOpenIcon,
  StorageIcon,
  ChevronRightIcon,
} from "../ui/icons";
import { OutputDetailsDrawer } from "./output-details-drawer";
import { ReproducibilityBadge } from "../ui/reproducibility-badge";
import { StatusBadge } from "../ui/status-badge";

// --- Helper Functions & Mocks ---
const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const mapOutputType = (type: string): LibraryOutputType => {
  switch (type) {
    case "Code":
      return "Model";
    case "Dataset":
      return "Dataset";
    case "Document":
      return "Paper";
    default:
      return "Space";
  }
};

// Main Library Component
export const OutputsLibrary = ({
  allProjects,
  onSelectProject,
}: {
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
}) => {
  const { downloadFilecoinFile, isLoading, error } = useApi();
  const [selectedOutput, setSelectedOutput] = useState<LibraryOutput | null>(
    null
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // --- UI State ---
  const [isGrouped, setIsGrouped] = useState(false);

  // --- Data Aggregation ---
  const { allOutputs, allTags, allLicenses } = useMemo(() => {
    const outputs: LibraryOutput[] = [];
    const tags = new Set<string>();
    const licenses = new Set<string>();

    allProjects.forEach((p) => {
      p.tags.forEach((t) => tags.add(t));
      if (p.license) licenses.add(p.license);
      const owner = MOCK_USERS.find((u) => u.walletAddress === p.ownerId);
      p.outputs.forEach((o) => {
        const reproducibilityStatus: ReproducibilityStatus =
          p.status === ProjectStatus.Reproducible ||
          p.status === ProjectStatus.Funded
            ? "Verified"
            : "Pending";
        outputs.push({
          ...o,
          projectName: p.title,
          projectId: p.id,
          projectOwnerName: owner?.name || "Unknown Researcher",
          projectTags: p.tags,
          libraryType: mapOutputType(o.type),
          metrics: {
            downloads: o.metrics?.downloads ?? 0,
            stars: o.metrics?.stars ?? 0,
            citations: o.metrics?.citations ?? 0,
          },
          reproducibility: reproducibilityStatus,
        });
      });
    });
    return {
      allOutputs: outputs,
      allTags: Array.from(tags).sort(),
      allLicenses: Array.from(licenses).sort(),
    };
  }, [allProjects]);

  // --- Filtering & Sorting State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortKey, setSortKey] = useState("downloads");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeLicenses, setActiveLicenses] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // --- Download Handler ---
  const handleFilecoinDownload = async () => {
    try {
      await downloadFilecoinFile(
        "bafkzcibdtaaqokx37h22hakicy67potrkdnsdxeuiqlnwhhzs6y5pbma3xcqtkaz",
        "test-dataset.zip"
      );
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // --- Memoized Filtering and Sorting ---
  const filteredOutputs = useMemo(() => {
    return allOutputs.filter((o) => {
      const project = allProjects.find((p) => p.id === o.projectId);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        o.description.toLowerCase().includes(searchLower) ||
        o.projectName.toLowerCase().includes(searchLower) ||
        o.projectOwnerName.toLowerCase().includes(searchLower) ||
        o.projectTags.some((t) => t.toLowerCase().includes(searchLower));

      const matchesType = typeFilter === "All" || o.libraryType === typeFilter;
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((t) => o.projectTags.includes(t));
      const matchesVerified =
        !showVerifiedOnly || o.reproducibility === "Verified";
      const matchesLicense =
        activeLicenses.length === 0 ||
        (project?.license && activeLicenses.includes(project.license));

      return (
        matchesSearch &&
        matchesType &&
        matchesTags &&
        matchesVerified &&
        matchesLicense
      );
    });
  }, [
    allOutputs,
    allProjects,
    searchTerm,
    typeFilter,
    activeTags,
    showVerifiedOnly,
    activeLicenses,
  ]);

  const finalSortedList = useMemo(() => {
    return [...filteredOutputs].sort((a, b) => {
      switch (sortKey) {
        case "downloads":
          return b.metrics.downloads - a.metrics.downloads;
        case "stars":
          return b.metrics.stars - a.metrics.stars;
        case "citations":
          return b.metrics.citations - a.metrics.citations;
        case "recent":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "verified":
          const score = (s: ReproducibilityStatus) =>
            s === "Verified" ? 3 : s === "Pending" ? 2 : 1;
          return score(b.reproducibility) - score(a.reproducibility);
        default:
          return 0;
      }
    });
  }, [filteredOutputs, sortKey]);

  const groupedAndFilteredProjects = useMemo(() => {
    if (!isGrouped) return [];
    const projectMap = new Map<
      string,
      { project: Project; outputs: LibraryOutput[] }
    >();

    finalSortedList.forEach((output) => {
      const project = allProjects.find((p) => p.id === output.projectId);
      if (project) {
        if (!projectMap.has(project.id)) {
          projectMap.set(project.id, { project, outputs: [] });
        }
        projectMap.get(project.id)?.outputs.push(output);
      }
    });

    return Array.from(projectMap.values());
  }, [isGrouped, finalSortedList, allProjects]);

  const handleToggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  const handleToggleLicense = (license: string) =>
    setActiveLicenses((prev) =>
      prev.includes(license)
        ? prev.filter((l) => l !== license)
        : [...prev, license]
    );

  // --- UI Sub-components ---
  const FilterDropdown = ({
    title,
    allItems,
    activeItems,
    onToggleItem,
  }: {
    title: string;
    allItems: string[];
    activeItems: string[];
    onToggleItem: (item: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node))
          setIsOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-48 px-3 py-2 text-sm border border-border dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark-light"
        >
          <span>
            {title} ({activeItems.length})
          </span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        {isOpen && (
          <div className="absolute z-20 w-56 mt-1 bg-background-light dark:bg-background-dark-light border border-border dark:border-border-dark rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {allItems.map((item) => (
              <label
                key={item}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeItems.includes(item)}
                  onChange={() => onToggleItem(item)}
                  className="h-4 w-4 mr-2 rounded text-primary focus:ring-primary border-hf-gray-300"
                />
                {item}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (c: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center space-x-2">
      <label htmlFor="group-toggle" className="text-sm font-medium">
        {label}
      </label>
      <button
        id="group-toggle"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark ${
          checked ? "bg-primary" : "bg-hf-gray-300 dark:bg-hf-gray-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  const OutputListRow = ({ output }: { output: LibraryOutput }) => (
    <div className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-hf-gray-50 dark:hover:bg-hf-gray-800/20 transition-colors">
      <div className="col-span-12 md:col-span-5">
        <p className="font-semibold text-text-primary dark:text-dark-text-primary">
          {output.description}
        </p>
        <button
          onClick={() =>
            onSelectProject(allProjects.find((p) => p.id === output.projectId)!)
          }
          className="text-sm text-primary hover:underline"
        >
          {output.projectName}
        </button>
        <div className="mt-1 flex flex-wrap gap-1">
          {output.projectTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-hf-gray-200 dark:bg-hf-gray-700 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="col-span-4 md:col-span-1">
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light`}
        >
          {output.libraryType}
        </span>
      </div>
      <div className="col-span-8 md:col-span-2 flex items-center space-x-3 text-sm">
        <span className="flex items-center space-x-1" title="Downloads">
          <DownloadIcon className="w-4 h-4" />{" "}
          <span>{numberFormatter.format(output.metrics.downloads)}</span>
        </span>
        <span className="flex items-center space-x-1" title="Likes">
          <StarIcon className="w-4 h-4" />{" "}
          <span>{numberFormatter.format(output.metrics.stars)}</span>
        </span>
        <span className="flex items-center space-x-1" title="Citations">
          <BookOpenIcon className="w-4 h-4" />{" "}
          <span>{numberFormatter.format(output.metrics.citations)}</span>
        </span>
      </div>
      <div className="col-span-12 md:col-span-4 flex md:justify-between items-center gap-4">
        <ReproducibilityBadge status={output.reproducibility} />
        <button
          onClick={handleFilecoinDownload}
          disabled={isLoading}
          className="group inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg transition-all duration-300 ease-in-out hover:bg-primary-hover shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <StorageIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span>{isLoading ? "Downloading..." : "Test Download"}</span>
        </button>
      </div>
    </div>
  );

  const ProjectGroupCard = ({
    project,
    outputs,
  }: {
    project: Project;
    outputs: LibraryOutput[];
  }) => (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark overflow-hidden">
      <div className="p-4 bg-hf-gray-50 dark:bg-hf-gray-900/50 border-b border-border dark:border-border-dark">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              {project.title}
            </h3>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              {project.description}
            </p>
          </div>
          <button
            onClick={() => {
              console.log(
                "View Project clicked for:",
                project.title,
                project.id
              );
              onSelectProject(project);
            }}
            className="flex items-center space-x-2 font-semibold text-primary text-sm py-1 px-3 rounded-full hover:bg-primary-light dark:hover:bg-primary/20"
          >
            <span>View Project</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusBadge status={project.status} />
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-hf-gray-200 dark:bg-hf-gray-700 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border dark:divide-border-dark">
        {outputs.map((output) => (
          <OutputListRow key={output.id} output={output} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">
            Download error: {error}
          </p>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
          Reproduced Projects
        </h1>
        <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">
          Browse projects that have been successfully reproduced by the
          community. Download verified assets from Filecoin.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search name, author, tag…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-border dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark-light focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="h-10 px-3 border border-border dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark-light text-sm focus:ring-1 focus:ring-primary"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="citations">Most Cited</option>
              <option value="stars">Most Liked</option>
              <option value="recent">Recently Added</option>
              <option value="verified">Verified First</option>
            </select>
            <FilterDropdown
              title="Tags"
              allItems={allTags}
              activeItems={activeTags}
              onToggleItem={handleToggleTag}
            />
            <FilterDropdown
              title="License"
              allItems={allLicenses}
              activeItems={activeLicenses}
              onToggleItem={handleToggleLicense}
            />
          </div>
          <div className="flex items-center space-x-4">
            <ToggleSwitch
              label="Verified only"
              checked={showVerifiedOnly}
              onChange={setShowVerifiedOnly}
            />
            <div className="h-6 w-px bg-border dark:border-border-dark" />
            <ToggleSwitch
              label="Group by Project"
              checked={isGrouped}
              onChange={setIsGrouped}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {isGrouped ? (
        <div className="space-y-6">
          {groupedAndFilteredProjects.length > 0 ? (
            groupedAndFilteredProjects.map(({ project, outputs }) => (
              <ProjectGroupCard
                key={project.id}
                project={project}
                outputs={outputs}
              />
            ))
          ) : (
            <div className="text-center py-16 px-6 bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark">
              <p className="font-semibold">No results match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark overflow-hidden">
          <div className="divide-y divide-border dark:divide-border-dark">
            {finalSortedList.length > 0 ? (
              finalSortedList.map((output) => (
                <OutputListRow key={output.id} output={output} />
              ))
            ) : (
              <div className="text-center py-16 px-6">
                <p className="font-semibold">No results match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOutput && selectedProject && (
        <OutputDetailsDrawer
          output={selectedOutput}
          project={selectedProject}
          onClose={() => {
            setSelectedOutput(null);
            setSelectedProject(null);
          }}
          onSelectProject={onSelectProject}
        />
      )}
    </div>
  );
};
