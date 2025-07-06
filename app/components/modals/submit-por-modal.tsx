"use client";

import { useState, ComponentProps, memo } from "react";
import { Project, ProofOfReproducibility } from "../../lib/types";
import { Modal } from "../ui/modal";
import { SpinnerIcon, CheckCircleIcon, AlertTriangleIcon } from "../ui/icons";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useContract } from "../../context/contract-context";

// Step-related types
type CreationStatus = "form" | "creating" | "success" | "error";
type StepStatus = "pending" | "active" | "success" | "error";
interface Step {
  name: string;
  description: string;
  status: StepStatus;
}

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
    default:
      return (
        <div className="w-3 h-3 rounded-full bg-cairn-gray-300 dark:bg-cairn-gray-600" />
      );
  }
};

const StepTracker = ({ steps }: { steps: Step[] }) => (
  <div className="py-6 px-4">
    <h3 className="text-lg font-semibold text-center mb-2 text-text dark:text-text-dark">
      Reproducibility submission in progress
    </h3>
    <p className="text-sm text-center text-text-secondary dark:text-text-dark-secondary mb-4">
      Please confirm transactions when prompted.
    </p>
    <p className="text-sm text-text-secondary dark:text-text-dark-secondary text-center mb-4">
      Note: Process may take ~2 minutes due to Calibration Testnet RPC latency.
    </p>
    <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-8">
      Do not close this window or refresh until the transaction completes.
    </p>
    <ol className="relative border-l-2 border-border dark:border-border-dark ml-4">
      {steps.map((step, index) => (
        <li key={index} className="mb-8 ml-8 last:mb-0">
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

// Form fields
const FormInput = memo((props: ComponentProps<"input">) => (
  <input
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm"
  />
));
const FormTextarea = memo((props: ComponentProps<"textarea">) => (
  <textarea
    {...props}
    className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent h-24 focus:ring-1 focus:ring-primary focus:border-primary"
  />
));

// Main component
export const SubmitPorModal = ({
  project,
  onClose,
  onSubmit,
}: {
  project: Project;
  onClose: () => void;
  onSubmit: (data: ProofOfReproducibility) => void;
}) => {
  const { recordPoR } = useContract();
  const { uploadProofOfReproducibility } = useIpfsService();

  const [description, setDescription] = useState("");
  const [code_url, setCodeUrl] = useState("");
  const [output_url, setOutputUrl] = useState("");
  const [video_url, setVideoUrl] = useState("");

  const [status, setStatus] = useState<CreationStatus>("form");
  const [steps, setSteps] = useState<Step[]>([]);

  const handleFinalSubmit = async () => {
    if (!description || !code_url || !output_url) return;

    setStatus("creating");
    setSteps([
      {
        name: "1. Uploading to IPFS",
        description: "Storing reproducibility proof on IPFS.",
        status: "active",
      },
      {
        name: "2. Writing to contract",
        description: "Recording proof on-chain.",
        status: "pending",
      },
    ]);

    const timestamp = new Date().toISOString();
    const proofData: ProofOfReproducibility = {
      project_id: project.id,
      timestamp,
      description,
      code_url,
      output_url,
      video_url,
    };

    try {
      const cid = await uploadProofOfReproducibility(proofData);
      setSteps((s) =>
        s.map((step, i) =>
          i === 0
            ? { ...step, status: "success", description: `CID: ${cid}` }
            : i === 1
            ? { ...step, status: "active" }
            : step
        )
      );

      await recordPoR(project.id, cid.toString());
      setSteps((s) =>
        s.map((step, i) => (i === 1 ? { ...step, status: "success" } : step))
      );
      setStatus("success");
      onSubmit(proofData);
    } catch (err) {
      console.error("Failed to submit PoR:", err);
      setSteps((s) =>
        s.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step
        )
      );
      setStatus("error");
    }
  };

  const modalFooter = () => {
    if (status === "form") {
      return (
        <button
          onClick={handleFinalSubmit}
          disabled={!description || !code_url || !output_url}
          className="flex items-center space-x-2 bg-status-success text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>Submit</span>
        </button>
      );
    }
    if (status === "success") {
      return (
        <button
          onClick={onClose}
          className="bg-status-success text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors"
        >
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
        status === "form" ? "Submit for Reproducibility" : "Submitting PoR"
      }
      footer={modalFooter()}
    >
      {status === "form" ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Notes & Methodology
            </label>
            <FormTextarea
              placeholder="Describe your reproduction process, any deviations, and the outcome."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Code URL
            </label>
            <FormInput
              type="url"
              placeholder="https://example.com/code"
              value={code_url}
              onChange={(e) => setCodeUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Output URL
            </label>
            <FormInput
              type="url"
              placeholder="https://example.com/output"
              value={output_url}
              onChange={(e) => setOutputUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
              Video URL (optional)
            </label>
            <FormInput
              type="url"
              placeholder="https://example.com/video"
              value={video_url}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <StepTracker steps={steps} />
      )}
    </Modal>
  );
};
