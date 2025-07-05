// Updated AddOutputModal to accept a single ProjectOutput entry only

"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { UploadCloudIcon } from "../ui/icons";
import { Project, ProjectOutput, Tools } from "../../lib/types";
import { TOOL_OPTIONS } from "../../lib/constants";
import { useIpfsService } from "../../ipfs/ipfsService";
import { useContract } from "../../context/contract-context";

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

  const handleToolToggle = (tool: Tools) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

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

    let cid;
    try {
      cid = await uploadProjectOutput(output);
    } catch (error) {
      console.error("Failed to upload output to IPFS:", error);
      return;
    }
    if (!cid) {
      console.error("Failed to upload output to IPFS");
      return;
    }
    console.log("Output uploaded to IPFS with CID:", cid.toString());

    // Call the contract to add the output
    try {
      await addOutput(project.id, cid.toString());
      console.log("Output added to project on-chain");
    } catch (error) {
      console.error("Failed to add output to project on-chain:", error);
      return;
    }

    // onAddOutputs([output]);
  };

  return (
    <Modal
      onClose={onClose}
      title={`Add Output to "${project.title}"`}
      footer={
        <div className="flex justify-end">
          <button
            form="output-form"
            type="submit"
            className="flex items-center space-x-2 bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors"
          >
            <UploadCloudIcon className="w-5 h-5" />
            <span>Save Output</span>
          </button>
        </div>
      }
    >
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
    </Modal>
  );
};
