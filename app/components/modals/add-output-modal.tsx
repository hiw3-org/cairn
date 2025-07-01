"use client";

import { useState, useRef, useEffect } from "react";
import {
  Project,
  Output,
  OutputType,
  ToolOption,
  TOOL_OPTIONS,
} from "../../lib/types";
import { Modal } from "../ui/modal";
import {
  UploadCloudIcon,
  TrashIcon,
  LinkIcon,
  AlertTriangleIcon,
  FileTextIcon,
  DatabaseIcon,
  CodeIcon,
  ToolboxIcon,
  ChevronUpDownIcon,
  VideoIcon,
} from "../ui/icons";
import { REPRODUCIBILITY_TEMPLATES } from "../../lib/constants";

export const AddOutputModal = ({
  project,
  onClose,
  onAddOutputs,
}: {
  project: Project;
  onClose: () => void;
  onAddOutputs: (outputs: Output[]) => void;
}) => {
  const [stagedOutputs, setStagedOutputs] = useState<Output[]>([]);
  const [type, setType] = useState<OutputType>("Document");
  const [description, setDescription] = useState("");

  // Data fields state
  const [url, setUrl] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [fileName, setFileName] = useState("");
  const [otherText, setOtherText] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolOption[]>([]);

  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetForm = () => {
    setType("Document");
    setDescription("");
    setUrl("");
    setIpfsCid("");
    setFileName("");
    setOtherText("");
    setSelectedTools([]);
    setIsToolsDropdownOpen(false);
  };

  const handleToolToggle = (tool: ToolOption) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const newOutput: Output = {
      id: `out-staged-${Date.now()}`,
      type,
      timestamp: new Date().toISOString().split("T")[0],
      description,
      data: {},
    };

    switch (type) {
      case "Document":
      case "Dataset":
        newOutput.data = { url, ipfsCid, fileName };
        break;
      case "Code":
      case "Video":
        newOutput.data = { url };
        break;
      case "Tools & External Services":
        newOutput.data = { tools: selectedTools };
        break;
      case "Output Log":
        newOutput.data = { url, fileName };
        break;
      case "Others":
        newOutput.data = { url, ipfsCid, fileName, otherText };
        break;
    }
    setStagedOutputs((prev) => [...prev, newOutput]);
    resetForm();
  };

  const handleDeleteRecord = (outputId: string) => {
    setStagedOutputs((prev) => prev.filter((o) => o.id !== outputId));
  };

  const handleRecordOutputs = () => {
    if (stagedOutputs.length > 0) {
      onAddOutputs(stagedOutputs);
    }
  };

  const renderDataFields = () => {
    switch (type) {
      case "Document":
      case "Dataset":
        return (
          <>
            <input
              type="url"
              placeholder="URL to document (e.g., arXiv, G-Doc)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="text"
              placeholder="IPFS CID (optional)"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900"
            />
          </>
        );
      case "Code":
        return (
          <>
            <input
              type="url"
              placeholder="URL to code repository (e.g., GitHub)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
          </>
        );
      case "Video":
        return (
          <>
            <input
              type="url"
              placeholder="URL to video (e.g., YouTube, Vimeo)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
          </>
        );
      case "Tools & External Services":
        return (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsToolsDropdownOpen((prev) => !prev)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent text-left flex justify-between items-center"
              aria-haspopup="listbox"
              aria-expanded={isToolsDropdownOpen}
            >
              <span className="text-sm truncate pr-2">
                {selectedTools.length > 0
                  ? selectedTools.join(", ")
                  : "Select tools that apply..."}
              </span>
              <ChevronUpDownIcon className="w-5 h-5 text-cairn-gray-400 flex-shrink-0" />
            </button>
            {isToolsDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-cairn-gray-800 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <ul role="listbox" className="py-1">
                  {TOOL_OPTIONS.map((tool) => (
                    <li
                      key={tool}
                      className="text-sm hover:bg-cairn-blue-50 dark:hover:bg-cairn-blue-900/50"
                    >
                      <label className="w-full flex items-center px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTools.includes(tool)}
                          onChange={() => handleToolToggle(tool)}
                          className="mr-3 h-4 w-4 rounded border-gray-300 dark:border-cairn-gray-700 text-cairn-blue-600 focus:ring-cairn-blue-500"
                        />
                        {tool}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "Output Log":
        return (
          <>
            <input
              type="url"
              placeholder="URL to log file (e.g., Pastebin, Gist)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900"
            />
          </>
        );
      case "Others":
        return (
          <>
            <input
              type="url"
              placeholder="URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="text"
              placeholder="IPFS CID (optional)"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="text"
              placeholder="Additional text (e.g., commit hash)"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm"
            />
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900"
            />
          </>
        );
      default:
        return null;
    }
  };

  const outputIcons: Record<OutputType, React.FC<any>> = {
    Document: FileTextIcon,
    Dataset: DatabaseIcon,
    Code: CodeIcon,
    "Tools & External Services": ToolboxIcon,
    "Output Log": FileTextIcon,
    Others: LinkIcon,
    Video: VideoIcon,
  };

  const modalFooter = (
    <div className="space-y-4">
      <div className="flex items-start p-3 text-sm rounded-md bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 ring-1 ring-inset ring-yellow-200 dark:ring-yellow-800">
        <AlertTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Permanent Action:</span> This is a
          one-time action. Once recorded, these outputs are permanently
          associated with the project and cannot be modified or added to. Please
          review carefully before finalizing.
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleRecordOutputs}
          disabled={stagedOutputs.length === 0}
          className="flex items-center space-x-2 bg-cairn-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cairn-blue-700 transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed"
        >
          <UploadCloudIcon className="w-5 h-5" />
          <span>Record Outputs and Finalize</span>
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      onClose={onClose}
      title={`Add Outputs to "${project.title}"`}
      footer={modalFooter}
    >
      <div className="mb-6">
        <h4 className="text-md font-medium text-cairn-gray-800 dark:text-cairn-gray-200 mb-2">
          Output Guidelines
        </h4>
        <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400 mb-3">
          These are some examples of outputs for a project in the{" "}
          <strong>{project.domain}</strong> domain. Provide as much detail as
          possible.
        </p>
        <ul className="space-y-2 text-sm text-cairn-gray-600 dark:text-cairn-gray-400 list-disc list-inside bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-md">
          {REPRODUCIBILITY_TEMPLATES[project.domain].map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form to add a single record */}
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">
              Output Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OutputType)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent dark:text-white"
            >
              <option value="Document">Document</option>
              <option value="Dataset">Dataset</option>
              <option value="Code">Code</option>
              <option value="Tools & External Services">
                Tools & External Services
              </option>
              <option value="Video">Video</option>
              <option value="Output Log">Output Log</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="e.g., 'Sensor fusion algorithm implementation'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent h-24"
              required
            ></textarea>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300">
              Data Details
            </label>
            {renderDataFields()}
          </div>
          <button
            type="submit"
            className="w-full bg-cairn-blue-100 dark:bg-cairn-blue-900/50 text-cairn-blue-700 dark:text-cairn-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-200 dark:hover:bg-cairn-blue-900 transition-colors"
          >
            Add Output
          </button>
        </form>

        {/* Staging Area */}
        <div className="space-y-3">
          <h4 className="font-semibold">
            Staged Outputs ({stagedOutputs.length})
          </h4>
          <div className="bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg space-y-2 min-h-[200px] max-h-96 overflow-y-auto">
            {stagedOutputs.length === 0 ? (
              <p className="text-sm text-cairn-gray-500 text-center py-4">
                No outputs staged yet.
              </p>
            ) : (
              stagedOutputs.map((output) => {
                const Icon = outputIcons[output.type];
                return (
                  <div
                    key={output.id}
                    className="flex items-start justify-between bg-white dark:bg-cairn-gray-700 p-2 rounded-md"
                  >
                    <div className="flex items-start space-x-2">
                      <Icon className="w-5 h-5 mt-0.5 text-cairn-blue-500 flex-shrink-0" />
                      <p className="text-sm flex-grow">{output.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(output.id)}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
