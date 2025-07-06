import React, { useState } from "react";
import { Modal } from "../ui/modal";
import {
  UploadCloudIcon,
  SpinnerIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "../ui/icons";
import { Project, ProjectOutput, Tools } from "../../lib/types";
import { TOOL_OPTIONS } from "../../lib/constants";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useContract } from "../../context/contract-context";

// Types for creation process
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

const FormInput = (props: React.ComponentProps<"input">) => (
  <input
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm"
  />
);

const FormTextarea = (props: React.ComponentProps<"textarea">) => (
  <textarea
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent h-24 focus:ring-1 focus:ring-primary focus:border-primary"
  />
);

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

export const AddOutputModal = ({
  project,
  onClose,
  onAddOutputs,
}: {
  project: Project;
  onClose: () => void;
  onAddOutputs: (outputs: ProjectOutput[]) => void;
}) => {
  const { uploadProjectOutput } = useIpfsService();
  const { addOutput } = useContract();

  const [description, setDescription] = useState("");
  const [paperUrl, setPaperUrl] = useState("");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [codeUrl, setCodeUrl] = useState("");
  const [codeOutputUrl, setCodeOutputUrl] = useState("");
  const [tools, setTools] = useState<Tools[]>([]);
  const [otherTools, setOtherTools] = useState<string>("");

  const [status, setStatus] = useState<
    "form" | "creating" | "success" | "error"
  >("form");
  const [steps, setSteps] = useState<Step[]>([]);

  const handleToolToggle = (tool: Tools) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setStatus("creating");
    setSteps([
      {
        name: "1. Uploading to IPFS",
        description: "Storing output on IPFS.",
        status: "active",
      },
      {
        name: "2. Writing to contract",
        description: "Recording on-chain.",
        status: "pending",
      },
    ]);

    const output: ProjectOutput = {
      paper_url: paperUrl,
      description,
      resources: {
        dataset_url: datasetUrl,
        code_url: codeUrl,
        code_output_url: codeOutputUrl,
      },
      tools: {
        tools,
        other_tools: otherTools ? [otherTools] : [],
      },
    };

    try {
      const cid = await uploadProjectOutput(output);
      if (!cid) throw new Error("No CID returned from IPFS");

      setSteps((s) =>
        s.map((step, i) =>
          i === 0
            ? { ...step, status: "success", description: `CID: ${cid}` }
            : i === 1
            ? { ...step, status: "active" }
            : step
        )
      );

      await addOutput(project.id, cid.toString());

      setSteps((s) =>
        s.map((step, i) => (i === 1 ? { ...step, status: "success" } : step))
      );

      setStatus("success");
      onAddOutputs([output]);
    } catch (error) {
      console.error("Error adding output:", error);
      setSteps((s) =>
        s.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step
        )
      );
      setStatus("error");
    }
  };

  const renderSteps = () => <StepTracker steps={steps} />;

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  // Update isSubmitDisabled whenever relevant fields change
  React.useEffect(() => {
    setIsSubmitDisabled(
      !description.trim() || !paperUrl.trim() || !codeOutputUrl.trim()
    );
  }, [description, paperUrl, codeOutputUrl]);

  const renderFooter = () => {
    if (status === "form") {
      return (
        <button
          form="output-form"
          type="submit"
          disabled={isSubmitDisabled}
          className={`flex items-center space-x-2 font-semibold py-2.5 px-6 rounded-lg transition-colors
            ${
              isSubmitDisabled
                ? "bg-cairn-gray-300 text-cairn-gray-500 cursor-not-allowed"
                : "bg-primary text-primary-text hover:bg-primary-hover"
            }`}
        >
          <UploadCloudIcon className="w-5 h-5" />
          <span>Save Output</span>
        </button>
      );
    }
    if (status === "creating") {
      return (
        <button
          disabled
          className="bg-primary/80 text-primary-text font-semibold py-2.5 px-6 rounded-lg flex items-center cursor-wait"
        >
          <SpinnerIcon className="animate-spin w-5 h-5 mr-2" />
          Processing...
        </button>
      );
    }
    if (status === "success") {
      return (
        <button
          onClick={onClose}
          className="bg-status-success text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          Done
        </button>
      );
    }
    if (status === "error") {
      return (
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="text-gray-500">
            Close
          </button>
          <button
            onClick={() => {
              setStatus("form");
              setSteps([]);
            }}
            className="bg-status-warning text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-yellow-600"
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  return (
    <Modal
      onClose={status === "creating" ? () => {} : onClose}
      title={
        status === "form" ? `Add Output to "${project.title}"` : "Adding Output"
      }
      footer={renderFooter()}
    >
      {status === "form" ? (
        <form onSubmit={handleSubmit} id="output-form" className="space-y-4">
          <FormTextarea
            required
            placeholder="Output description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormInput
            type="url"
            placeholder="Main paper URL"
            value={paperUrl}
            onChange={(e) => setPaperUrl(e.target.value)}
          />
          <FormInput
            type="url"
            placeholder="Dataset URL"
            value={datasetUrl}
            onChange={(e) => setDatasetUrl(e.target.value)}
          />
          <FormInput
            type="url"
            placeholder="Code URL"
            value={codeUrl}
            onChange={(e) => setCodeUrl(e.target.value)}
          />
          <FormInput
            type="url"
            placeholder="Code Output URL"
            value={codeOutputUrl}
            onChange={(e) => setCodeOutputUrl(e.target.value)}
          />
          <div>
            <label className="block mb-1 font-medium">Tools</label>
            <div className="flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <label key={tool} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tools.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                  />
                  <span>{tool}</span>
                </label>
              ))}
            </div>
          </div>
          <FormInput
            type="text"
            placeholder="Other tools (comma-separated)"
            value={otherTools}
            onChange={(e) => setOtherTools(e.target.value)}
          />
        </form>
      ) : (
        renderSteps()
      )}
    </Modal>
  );
};
