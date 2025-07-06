"use client";

import React, { useState } from "react";
import { Project, ResearchDomain, ProjectStatus } from "../../lib/types";
import { Modal } from "../ui/modal";
import {
  RESEARCH_DOMAINS,
  REPRODUCIBILITY_TEMPLATES,
} from "../../lib/constants";
import { useAppContext } from "../../context/app-provider";
import {
  InfoIcon,
  SpinnerIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "../ui/icons";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useContract } from "../../context/contract-context";

// Types for creation process
type CreationStatus = "form" | "creating" | "success" | "error";
type StepStatus = "pending" | "active" | "success" | "error";
interface Step {
  name: string;
  description: string;
  status: StepStatus;
}

// Visual component for each step's icon
const StepIcon = ({ status }: { status: StepStatus }) => {
  switch (status) {
    case "success":
      return <CheckCircleIcon className="w-full h-full text-status-success" />;
    case "active":
      return (
        <SpinnerIcon className="w-full h-full text-primary animate-spin" />
      );
    case "error":
      return <AlertTriangleIcon className="w-full h-full text-status-danger" />;
    case "pending":
    default:
      return (
        <div className="w-3 h-3 rounded-full bg-cairn-gray-300 dark:bg-cairn-gray-600" />
      );
  }
};

// Component to display the creation steps
const StepTracker = ({ steps }: { steps: Step[] }) => (
  <div className="py-8 px-4">
    <h3 className="text-lg font-semibold text-center mb-2 text-text dark:text-text-dark">
      Your project is being created on-chain.
    </h3>
    <p className="text-sm text-text-secondary dark:text-text-dark-secondary text-center mb-8">
      Please approve the transactions in your wallet when prompted.
    </p>
    <ol className="relative border-l-2 border-border dark:border-border-dark ml-4">
      {steps.map((step, index) => (
        <li key={index} className="mb-10 ml-8 last:mb-0">
          <span
            className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-background-light dark:ring-background-dark-light ${
              step.status === "pending"
                ? "bg-cairn-gray-200 dark:bg-cairn-gray-700"
                : "bg-transparent"
            }`}
          >
            <StepIcon status={step.status} />
          </span>
          <h4
            className={`font-semibold ${
              step.status === "pending"
                ? "text-text-secondary dark:text-text-dark-secondary"
                : "text-text dark:text-text-dark"
            }`}
          >
            {step.name}
          </h4>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {step.description}
          </p>
          {step.status === "error" && (
            <p className="text-sm font-semibold text-status-danger mt-1">
              Transaction failed. Please try again.
            </p>
          )}
        </li>
      ))}
    </ol>
  </div>
);

const FormInput = React.memo((props: React.ComponentProps<"input">) => (
  <input
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
  />
));
const FormTextarea = React.memo((props: React.ComponentProps<"textarea">) => (
  <textarea
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent h-24 focus:ring-1 focus:ring-primary focus:border-primary"
  />
));
const FormSelect = React.memo((props: React.ComponentProps<"select">) => (
  <select
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
  />
));

export const NewProjectModal = ({
  onClose,
  onAddProject,
}: {
  onClose: () => void;
  onAddProject: (p: Project) => void;
}) => {
  const { registerProject } = useIpfsService();
  const { mintHypercert, approveHypercertTransfer, registerProjectCairn } =
    useContract();

  const { currentUser, handleAddProject } = useAppContext();
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<ResearchDomain>(ResearchDomain.Robotics);
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [additionalInfoUrl, setAdditionalInfoUrl] = useState("");
  const [funduingGoal, setFundingGoal] = useState(100);
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [creationStatus, setCreationStatus] = useState<CreationStatus>("form");
  const [steps, setSteps] = useState<Step[]>([]);

  const handleCreateProject = async () => {
    if (!title || !description || !currentUser) return;

    setCreationStatus("creating");

    const initialSteps: Step[] = [
      {
        name: "1. Uploading project metadata to IPFS",
        description: "Storing project details on IPFS.",
        status: "active",
      },
      {
        name: "2. Minting Hypercert",
        description:
          "Generating the fractionalized impact certificate. Please confirm the transaction in your wallet.",
        status: "pending",
      },
      {
        name: "3. Setting hypercert approval",
        description: "Please confirm the transaction in your wallet.",
        status: "pending",
      },
      {
        name: "4. Linking Impact Assets",
        description:
          "Connecting the project and Hypercert token ID. Please confirm the transaction in your wallet.",
        status: "pending",
      },
    ];
    setSteps(initialSteps);

    try {
      console.log("Starting project creation process...");

      console.log("User ", currentUser, "is creating a new project");
      const projectData = {
        title: title,
        description: description,
        created_at: new Date().toISOString(),
        owner_address: currentUser.walletAddress,
        organization: organization || undefined,
        url: additionalInfoUrl || undefined,
        image_url: imageUrl || undefined,
        tags: tags,
        domain: domain,
      };

      const cid = await registerProject(projectData);

      if (!cid) {
        throw new Error("Failed to register project on IPFS.");
      }
      console.log("Project metadata stored with CID:", cid.toString());
      setSteps((steps) =>
        steps.map((step, index) =>
          index === 0
            ? {
                ...step,
                status: "success",
                description: `Metadata stored IPFS CID: ${cid.toString()}`,
              }
            : index === 1
            ? { ...step, status: "active" }
            : step
        )
      );

      console.log("Minting Hypercert for project...");
      const hypercertUnits = 1000; // Example units, adjust as needed
      const restrictions = 0;
      const hypercerUrl = cid.toString();
      const hypercertTokenId = await mintHypercert(
        hypercertUnits,
        hypercerUrl,
        restrictions
      );
      if (!hypercertTokenId) {
        throw new Error("Failed to mint Hypercert.");
      }
      console.log(
        "Hypercert minted with token ID:",
        hypercertTokenId.toString()
      );

      // 15 sec delay
      await new Promise((resolve) => setTimeout(resolve, 30000));

      setSteps((steps) =>
        steps.map((step, index) =>
          index === 1
            ? {
                ...step,
                status: "success",
                description: `Hypercert Token ID: ${hypercertTokenId.toString()}`,
              }
            : index === 2
            ? { ...step, status: "active" }
            : step
        )
      );

      // Approve Hypercert transfer
      console.log("Approving Hypercert transfer...");
      const approvalSuccess = await approveHypercertTransfer();
      console.log("Hypercert transfer approval status:", approvalSuccess);

      if (!approvalSuccess) {
        throw new Error("Failed to approve Hypercert transfer.");
      }

      await new Promise((resolve) => setTimeout(resolve, 30000));

      setSteps((steps) =>
        steps.map((step, index) =>
          index === 2
            ? {
                ...step,
                status: "success",
              }
            : index === 3
            ? { ...step, status: "active" }
            : step
        )
      );

      // Register project with Hypercert token ID
      console.log("Registering project with Hypercert token ID...");
      await registerProjectCairn(
        cid.toString(),
        hypercertTokenId,
        BigInt(funduingGoal) // Convert to smallest unit (e.g., USDC)
      );
      console.log(
        "Project registered successfully with Hypercert token ID and IPFS CID."
      );
      setSteps((steps) =>
        steps.map((step, index) =>
          index === 3
            ? {
                ...step,
                status: "success",
                description: `Project linked with Hypercert Token ID: ${hypercertTokenId.toString()} add IPFS CID: ${cid.toString()}`,
              }
            : step
        )
      );

      setCreationStatus("success");

      handleAddProject({
        id: cid.toString(),
        cid: cid.toString(),
        title,
        description,
        organization: organization || undefined,
        additionalInfoUrl: additionalInfoUrl || undefined,
        fundingGoal: funduingGoal,
        createdAt: new Date().toISOString(),
        ownerId: currentUser.walletAddress,
        output: [],
        reproducibilities: [],
        image_url: imageUrl || undefined,
        funder: "0x0000000000000000000000000000000000000",
      });
    } catch (error) {
      setCreationStatus("error");
      setSteps((currentSteps) =>
        currentSteps.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step
        )
      );
    }
  };

  const renderContent = () => {
    if (creationStatus === "form") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Project Title
            </label>
            <FormInput
              type="text"
              placeholder="e.g., Autonomous Drone Navigation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Description
            </label>
            <FormTextarea
              placeholder="A brief summary of your research goals and methods."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Organization (Optional)
              </label>
              <FormInput
                type="text"
                placeholder="e.g., Atlas Robotics"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Contributor Info URL (Optional)
              </label>
              <FormInput
                type="url"
                placeholder="e.g., Google Scholar, lab site"
                value={additionalInfoUrl}
                onChange={(e) => setAdditionalInfoUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Research Domain
              </label>
              <FormSelect
                value={domain}
                onChange={(e) => setDomain(e.target.value as ResearchDomain)}
              >
                {RESEARCH_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Tags
              </label>
              <FormInput
                type="text"
                placeholder="AI, Robotics, SLAM (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Funding Goal (USD)
              </label>
              <FormInput
                type="number"
                placeholder="100"
                value={funduingGoal}
                onChange={(e) => setFundingGoal(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                Image url (tested only with imgur links)
              </label>
              <FormInput
                type="string"
                placeholder="imgur link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-start p-3 mb-3 text-sm rounded-lg bg-status-info-bg text-status-info dark:bg-status-info-bg-dark/50">
              <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <span>
                New projects have a status of a <strong>Draft</strong> and are
                not publicly visible until you provide Research Outputs. Go to
                your project list and Manage your new project.
              </span>
            </div>
            <h4 className="text-md font-medium text-text dark:text-text-dark mb-2">
              Research Output Guidelines
            </h4>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3">
              These are some examples of outputs for a project in the{" "}
              <strong>{domain}</strong> domain. Provide as much detail as
              possible.
            </p>
            <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg">
              {REPRODUCIBILITY_TEMPLATES[domain].map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    return <StepTracker steps={steps} />;
  };

  const renderFooter = () => {
    const handleRetry = () => {
      setCreationStatus("form");
      setSteps([]);
    };

    if (creationStatus === "form") {
      return (
        <div className="flex justify-end">
          <button
            onClick={handleCreateProject}
            disabled={!title || !description}
            className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      );
    }
    if (creationStatus === "creating") {
      return (
        <div className="flex justify-end">
          <button
            disabled
            className="bg-primary/80 text-primary-text font-semibold py-2.5 px-6 rounded-lg flex items-center cursor-wait"
          >
            <SpinnerIcon className="animate-spin w-5 h-5 mr-2" />
            Processing...
          </button>
        </div>
      );
    }
    if (creationStatus === "success") {
      return (
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-status-success text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Done
          </button>
        </div>
      );
    }
    if (creationStatus === "error") {
      return (
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="text-text-secondary dark:text-text-dark-secondary font-semibold py-2.5 px-4 rounded-lg hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700"
          >
            Close
          </button>
          <button
            onClick={handleRetry}
            className="bg-status-warning text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      onClose={creationStatus === "creating" ? () => {} : onClose}
      title={
        creationStatus === "form"
          ? "Create New Project"
          : "Project Creation Status"
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Modal>
  );
};
