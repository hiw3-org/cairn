"use client";

import React, { useState, useMemo } from "react";
import { Project, ProjectStatus, FundingEvent } from "../../lib/types";
import {
  CheckIcon,
  ScaleIcon,
  UsersGroupIcon,
  GavelIcon,
  CopyIcon,
  FileTextIcon,
} from "../ui/icons";
import { GenerativePlaceholder } from "../ui/generative-placeholder";
import { useAppContext } from "../../context/app-provider";
import { useClipboard } from "../../hooks/use-clipboard";
import { ImpactLevelBadge } from "../ui/impact-level-badge";
import { useContract } from "@/context/contract-context";

const StatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.FC<any>;
  title: string;
  value: string | number;
}) => (
  <div className="bg-background-light dark:bg-background-dark-light p-6 rounded-xl flex items-start space-x-4 border border-border dark:border-border-dark h-full">
    <div className="bg-primary-light dark:bg-primary/20 p-3 rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary dark:text-primary-light" />
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
        {title}
      </p>
      <p className="text-3xl font-bold text-text dark:text-text-dark">
        {value}
      </p>
    </div>
  </div>
);

const getImpactLevel = (fraction: number): "High" | "Medium" | "Low" => {
  if (fraction >= 0.75) return "High";
  if (fraction >= 0.3) return "Medium";
  return "Low";
};

const FundingHistoryWidget = ({
  history,
  projects,
  onSelectProject,
}: {
  history: FundingEvent[];
  projects: Project[];
  onSelectProject: (p: Project) => void;
}) => {
  const TxHash = ({ hash }: { hash: string }) => {
    const { copy, copied } = useClipboard();
    return (
      <div className="flex items-center space-x-2">
        <a
          href="cairn/app/components/dashboard#"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-primary hover:underline"
          title={hash}
        >
          {/* {hash.substring(0, 8)}...{hash.substring(hash.length - 6)} */}
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copy(hash);
          }}
          className="p-1 rounded-full text-text-secondary hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700"
        >
          {copied ? (
            <CheckIcon className="h-3 w-3 text-status-success" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-5 border border-border dark:border-border-dark shadow-sm h-full">
      <h4 className="font-semibold mb-4 text-text dark:text-text-dark">
        Funding History
      </h4>
      <div className="max-h-[30rem] overflow-y-auto -mr-3 pr-3">
        {history.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="text-xs text-text-secondary dark:text-text-dark-secondary uppercase">
                <th className="p-2 font-semibold">Project</th>
                <th className="p-2 font-semibold">Impact assets</th>
                <th className="p-2 font-semibold">TX Hash</th>
                <th className="p-2 font-semibold text-right">Amount</th>
                <th className="p-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {history.map((event) => {
                const project = projects.find((p) => p.id === event.projectId);
                if (!project) return null;
                const impactLevel = getImpactLevel(project.hypercertFraction);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-cairn-gray-100 dark:hover:bg-cairn-gray-800/80 transition-colors"
                  >
                    <td className="p-3">
                      <p className="font-semibold text-text dark:text-text-dark truncate">
                        {event.projectTitle}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        100%
                      </span>
                    </td>
                    <td className="p-3">
                      <TxHash hash={event.txHash} />
                    </td>
                    <td className="p-3 font-semibold text-right text-status-success">
                      ${(event.amount / 1_00).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => project && onSelectProject(project)}
                        disabled={!project}
                        className="text-xs bg-primary-light text-primary font-semibold py-1 px-3 rounded-full hover:bg-blue-200/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">
            No funding contributions yet.
          </p>
        )}
      </div>
    </div>
  );
};

const FunderProjectCard = ({
  project,
  onSelectProject,
}: {
  project: Project;
  onSelectProject: (p: Project) => void;
}) => {
  const { setFundingHistory, currentUser } = useAppContext();
  const { fundProject, approveUSDCTransfer } = useContract();
  const [isFunded, setIsFunded] = useState(false);
  const [fundingInProgress, setFundingInProgress] = useState(false);
  const [isImpactOwner, setIsImpactOwner] = useState(false);

  const onFund = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!project.fundingGoal || project.fundingGoal <= 0) return;

    try {
      setFundingInProgress(true);
      const amount = BigInt(1000000); // Convert to smallest unit (e.g., cents for USDC)
      // Approve USDC transfer
      const approved = await approveUSDCTransfer(amount);
      if (!approved) {
        console.error("USDC approval failed");
        alert("USDC approval failed. Check console.");
        return;
      }
      console.log("USDC approved for funding");

      // Fund project
      await fundProject(amount, project.id);
      console.log("Funding successful");
      setFundingInProgress(false);
      setIsFunded(true);
      const newEvent: FundingEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        amount: Number(amount),
        funderWallet: currentUser?.walletAddress ?? "0x0",
        projectId: project.id,
        projectTitle: project.title,
      };
      setFundingHistory((prev) => [...prev, newEvent]);
    } catch (err) {
      console.error("Funding failed:", err);
      alert("Funding failed. Check console.");
    }
  };

  const impactLevel = getImpactLevel(project.hypercertFraction);

  return (
    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-border dark:border-border-dark overflow-hidden flex flex-col">
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
        <h3 className="text-lg font-semibold text-text dark:text-text-dark">
          {project.title}
        </h3>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
          {project.domain}
        </p>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 line-clamp-2">
          {project.description}
        </p>
        <div className="mt-3">
          <ImpactLevelBadge level={"Medium"} />
        </div>
      </div>
      <div className="px-5 py-4 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 border-t border-border dark:border-border-dark mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary font-semibold">
            Funding Amount
          </span>
          <span className="text-lg font-bold text-text dark:text-text-dark">
            {project.fundingGoal
              ? `$${(project.fundingGoal / 1_00000).toLocaleString()}`
              : "Not Set"}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onSelectProject(project)}
            className="w-full bg-cairn-gray-200 dark:bg-cairn-gray-700 text-text-secondary dark:text-text-dark-secondary font-semibold py-2 px-4 rounded-lg hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600 transition-colors text-sm"
          >
            View Detail
          </button>
          <button
            onClick={onFund}
            disabled={
              fundingInProgress ||
              isFunded ||
              !project.fundingGoal ||
              project.fundingGoal <= 0 ||
              project.status === ProjectStatus.Archived
            }
            className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg text-sm transition-colors flex items-center justify-center ${
              isFunded
                ? "bg-status-success text-white cursor-default"
                : "bg-primary text-primary-text hover:bg-primary-hover"
            }`}
          >
            {fundingInProgress ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : null}
            {isFunded ? "Funded!" : fundingInProgress ? "Funding..." : "Fund"}
          </button>
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

export const FunderDashboard = ({
  onSelectProject,
  activePage,
  onNavigate,
}: {
  onSelectProject: (p: Project) => void;
  activePage: string;
  onNavigate: (page: string) => void;
}) => {
  const [activeFundMode, setActiveFundMode] = useState<"instant" | "dao">(
    "instant"
  );
  const { fundingHistory, currentUser, projects } = useAppContext();

  const myFundingHistory = useMemo(() => {
    if (!currentUser) return [];
    return fundingHistory.filter(
      (event) => event.funderWallet === currentUser.walletAddress
    );
  }, [fundingHistory, currentUser]);

  const totalFundingDeployed = useMemo(
    () => myFundingHistory.reduce((sum, e) => sum + e.amount, 0),
    [myFundingHistory]
  );
  const totalProjectsFunded = useMemo(
    () => new Set(myFundingHistory.map((f) => f.projectId)).size,
    [myFundingHistory]
  );

  const sharedFundingProjectsCount = useMemo(() => {
    if (!currentUser) return 0;
    const myFundedProjectIds = new Set(
      myFundingHistory.map((f) => f.projectId)
    );

    const sharedProjects = Array.from(myFundedProjectIds).filter(
      (projectId) => {
        const fundersForProject = new Set(
          fundingHistory
            .filter((event) => event.projectId === projectId)
            .map((event) => event.funderWallet)
        );
        return fundersForProject.size > 1;
      }
    );

    return sharedProjects.length;
  }, [myFundingHistory, fundingHistory, currentUser]);

  let content;

  if (activePage === "discover") {
    content = (
      <>
        <PageHeader
          title="Discover & Fund Projects"
          subtitle="Find and support promising research initiatives."
        />
        <div className="border-b border-border dark:border-border-dark mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveFundMode("instant")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeFundMode === "instant"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text hover:border-cairn-gray-300 dark:hover:text-text-dark dark:hover:border-cairn-gray-600"
              }`}
            >
              Instant Retrospective Funding
            </button>
            <div className="relative group">
              <button
                disabled
                className="whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm border-transparent text-cairn-gray-400 dark:text-cairn-gray-600 cursor-not-allowed"
              >
                DAO Voted Funding
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-text text-background-light dark:bg-text-dark dark:text-background-dark text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming Soon
              </div>
            </div>
          </nav>
        </div>

        {activeFundMode === "instant" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {projects
              .filter((p) => p.output.length > 0)
              .map((p) => (
                <FunderProjectCard
                  key={p.id}
                  project={p}
                  onSelectProject={onSelectProject}
                />
              ))}
          </div>
        )}
        {activeFundMode === "dao" && (
          <div className="text-center py-16 px-6 border-2 border-dashed border-border dark:border-border-dark rounded-xl bg-cairn-gray-100 dark:bg-cairn-gray-800/50">
            <GavelIcon className="mx-auto h-12 w-12 text-text-secondary" />
            <h3 className="mt-4 text-xl font-semibold text-text dark:text-text-dark">
              DAO Voting is Coming Soon
            </h3>
            <p className="mt-2 text-md text-text-secondary dark:text-text-dark-secondary">
              This feature will allow CAIRN token holders to collectively decide
              on funding allocations.
            </p>
          </div>
        )}
      </>
    );
  } else {
    // 'portfolio' and default
    content = (
      <>
        <PageHeader
          title="Funding Portfolio"
          subtitle="An overview of your funding activity and impact."
        />
        <div className="bg-background-light dark:bg-background-dark-light p-6 rounded-xl border border-border dark:border-border-dark">
          <h2 className="text-xl font-semibold mb-6 text-text dark:text-text-dark">
            Portfolio Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={ScaleIcon}
              title="Total Funding Deployed"
              value={`$${(totalFundingDeployed / 1_00).toLocaleString()}`}
            />
            <StatCard
              icon={FileTextIcon}
              title="Total Projects Funded"
              value={totalProjectsFunded}
            />
            <StatCard
              icon={UsersGroupIcon}
              title="Shared Funding Projects"
              value={sharedFundingProjectsCount}
            />
          </div>
        </div>
        <FundingHistoryWidget
          history={myFundingHistory}
          projects={projects}
          onSelectProject={onSelectProject}
        />
      </>
    );
  }

  return <div className="space-y-8 animate-fade-in">{content}</div>;
};
