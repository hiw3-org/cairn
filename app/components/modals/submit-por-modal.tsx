"use client";

import { useState, ComponentProps, memo } from "react";
import { Project, ProofOfReproducibility } from "../../lib/types";
import { Modal } from "../ui/modal";
import { CheckCircleIcon } from "../ui/icons";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useAppContext } from "../../context/app-provider";

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

export const SubmitPorModal = ({
  project,
  onClose,
  onSubmit,
}: {
  project: Project;
  onClose: () => void;
  onSubmit: (data: ProofOfReproducibility) => void;
}) => {
  const { handlePorSubmit } = useAppContext();
  const { uploadProofOfReproducibility } = useIpfsService();
  const [description, setDescription] = useState("");
  const [code_url, setCodeUrl] = useState("");
  const [output_url, setOutputUrl] = useState("");
  const [video_url, setVideoUrl] = useState("");

  const handleFinalSubmit = async () => {
    if (!description || !code_url || !output_url) return;

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
      console.log("Submitting PoR data:", proofData);
      // let cid = await uploadProofOfReproducibility(proofData); // Upload to IPFS
      // console.log("PoR uploaded to IPFS with CID:", cid.toString());
      handlePorSubmit(project.id, proofData);
    } catch (err) {
      console.error("Failed to submit PoR:", err);
      alert("Failed to submit PoR. See console for details.");
    }
  };

  const modalFooter = (
    <div className="flex justify-end">
      <button
        onClick={handleFinalSubmit}
        disabled={!description || !code_url || !output_url}
        className="flex items-center space-x-2 bg-status-success text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed"
      >
        <CheckCircleIcon className="w-5 h-5" />
        <span>Submit</span>
      </button>
    </div>
  );

  return (
    <Modal
      onClose={onClose}
      title="Submit for Reproducibility"
      footer={modalFooter}
    >
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
    </Modal>
  );
};
