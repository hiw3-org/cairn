"use client";

import React from "react";
import {
  Project,
  ResearchDomain,
  ProjectStatus,
  Output,
  HuggingFaceOutput,
  OutputType,
} from "../../lib/types";
import { Modal } from "../ui/modal";
import { useAppContext } from "../../context/app-provider";
import { useApi } from "../../context/api-context";
import {
  SpinnerIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HuggingFaceIcon,
  TrashIcon,
  FileTextIcon,
  UploadCloudIcon,
  LightbulbIcon,
  SearchIcon,
  EyeIcon,
} from "../ui/icons";
const WIZARD_STEPS = [
  { id: 1, name: "Selected Outputs", icon: HuggingFaceIcon },
  { id: 2, name: "Project Basics", icon: EyeIcon },
  { id: 3, name: "Add Research papers", icon: FileTextIcon },
  { id: 4, name: "Create", icon: CheckCircleIcon },
];

const RESEARCH_DOMAINS = [
  "llm",
  "vision",
  "nlp",
  "robotics",
  "ml",
  "ai",
  "other",
];

const WizardStepper = ({ currentStep }: { currentStep: number }) => (
  <nav aria-label="Progress" className="pb-16">
    <ol role="list" className="flex items-start justify-between relative">
      {WIZARD_STEPS.map((step, stepIdx) => (
        <li
          key={step.name}
          className="relative flex flex-col items-center flex-1"
        >
          {/* Connecting line */}
          {stepIdx > 0 && (
            <div className="absolute top-4 right-1/2 left-[-50%] h-0.5 -z-10">
              <div
                className={`h-full ${
                  step.id <= currentStep
                    ? "bg-primary"
                    : "bg-border dark:bg-border-dark"
                }`}
              />
            </div>
          )}

          <div className="relative z-10">
            {step.id < currentStep ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <CheckCircleIcon
                  className="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </div>
            ) : step.id === currentStep ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background-light dark:bg-background-dark-light">
                <step.icon
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-background-light dark:bg-background-dark-light">
                <step.icon
                  className="h-5 w-5 text-text-secondary/50"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          <span className="mt-3 text-center text-xs font-semibold text-text-secondary dark:text-dark-text-secondary px-2">
            {step.name}
          </span>
        </li>
      ))}
    </ol>
  </nav>
);

const HelpRail = ({ step }: { step: number }) => {
  const tips = [
    "Review the Hugging Face assets you selected. These will form the initial outputs for your new CAIRN project.",
    "Provide a clear title and description. Good metadata helps funders and other researchers discover your work.",
    "Add existing research papers directly from ArXiv or link them to your project from other archives.",
    "Review all details before creating your project. You can save a draft to complete it later.",
  ];
  return (
    <div className="w-64 flex-shrink-0 space-y-4">
      <div className="p-4 rounded-lg bg-primary-light/70 dark:bg-primary/10 border border-primary/20">
        <div className="flex items-center space-x-2">
          <LightbulbIcon className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-primary">Help</h4>
        </div>
        <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
          {tips[step - 1]}
        </p>
      </div>
    </div>
  );
};

// --- Wizard Step Components ---
const Step1_SelectedOutputs = ({
  outputs,
  onRemove,
}: {
  outputs: any[];
  onRemove: (id: string) => void;
}) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">
      Selected Hugging Face Outputs
    </h3>
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {outputs.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between p-3 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 border border-border dark:border-border-dark"
        >
          <div className="flex items-center space-x-3">
            <HuggingFaceIcon className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-semibold text-text-primary dark:text-dark-text-primary">
                {o.name}
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary capitalize">
                {o.type}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Step2_ProjectBasics = ({
  data,
  setData,
}: {
  data: any;
  setData: Function;
}) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold">Project Basics</h3>
    <div>
      <label className="block text-sm font-medium mb-1">Title</label>
      <input
        type="text"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        className="w-full h-11 px-3 border rounded-lg bg-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">
        Short Description
      </label>
      <textarea
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        className="w-full p-3 border rounded-lg bg-transparent min-h-[100px]"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Research Domain
        </label>
        <select
          value={data.domain}
          onChange={(e) => setData({ ...data, domain: e.target.value })}
          className="w-full h-11 px-3 border rounded-lg bg-transparent"
        >
          {RESEARCH_DOMAINS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">License</label>
        <select
          value={data.license}
          onChange={(e) => setData({ ...data, license: e.target.value })}
          className="w-full h-11 px-3 border rounded-lg bg-transparent"
        >
          <option>MIT</option>
          <option>Apache 2.0</option>
          <option>GPL</option>
          <option>Other</option>
        </select>
      </div>
    </div>
  </div>
);

const Step3_AddResearchPapers = ({
  data,
  setData,
}: {
  data: any;
  setData: Function;
}) => {
  const api = useApi(); // Add this
  const [arxivQuery, setArxivQuery] = React.useState("");
  const [arxivResults, setArxivResults] = React.useState<
    {
      arxiv_id: string;
      title: string;
      url: string;
      authors: string[];
      published: string;
      categories: string[];
    }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const searchArxiv = async (query: string) => {
    if (query.length < 3) return;

    setIsSearching(true);
    try {
      // Use the new API method
      const papers = await api.searchArxivByTitle(query, 5);

      setArxivResults(papers);
      setIsDropdownOpen(papers.length > 0);
    } catch (error) {
      console.error("Error fetching from arXiv:", error);
      setArxivResults([]);
      setIsDropdownOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    if (arxivQuery.length < 3) {
      setArxivResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const handler = setTimeout(() => {
      searchArxiv(arxivQuery);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [arxivQuery]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddArtifact = (item: {
    id: string;
    type: "paper" | "arxiv";
    url: string;
    title: string;
  }) => {
    if (!data.artifacts.some((a: any) => a.url === item.url)) {
      setData({ ...data, artifacts: [...data.artifacts, item] });
    }
  };

  const handleSelectArxiv = (paper: (typeof arxivResults)[0]) => {
    handleAddArtifact({
      id: paper.arxiv_id,
      type: "arxiv",
      url: paper.url,
      title: paper.title,
    });
    setArxivQuery("");
    setArxivResults([]);
    setIsDropdownOpen(false);
  };

  const handleAddPaperUrl = (url: string) => {
    if (!url) return;
    const mockTitle = `Paper from ${new URL(url).hostname}`;
    handleAddArtifact({
      id: Date.now().toString(),
      type: "paper",
      url,
      title: mockTitle,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Add Research Papers</h3>
      <p className="text-sm text-text-secondary">
        Search ArXiv directly or link research papers from any other repository.
      </p>

      {/* ArXiv Search */}
      <div className="relative" ref={searchRef}>
        <label className="block text-sm font-medium mb-1">
          Search ArXiv by Title
        </label>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="search"
            placeholder="e.g., Attention Is All You Need"
            value={arxivQuery}
            onChange={(e) => setArxivQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-3 border rounded-lg bg-transparent"
          />
          {isSearching && (
            <SpinnerIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
          )}
        </div>
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-background-light dark:bg-background-dark-light border rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
            <ul>
              {arxivResults.map((paper) => (
                <li
                  key={paper.arxiv_id}
                  onClick={() => handleSelectArxiv(paper)}
                  className="p-3 hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 cursor-pointer border-b border-border dark:border-border-dark last:border-b-0"
                >
                  <p className="font-semibold text-sm">{paper.title}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {paper.authors.join(", ")}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    arXiv:{paper.arxiv_id}
                  </p>
                  {paper.categories.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {paper.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-primary-light px-1 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* General Paper URL */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Other Research Paper URL
        </label>
        <input
          type="url"
          placeholder="https://researchgate.net/..."
          onBlur={(e) => {
            if (e.target.value) {
              handleAddPaperUrl(e.target.value);
              e.target.value = ""; // Clear after adding
            }
          }}
          className="w-full h-11 px-3 border rounded-lg bg-transparent"
        />
      </div>

      {/* Added Artifacts List */}
      {data.artifacts.length > 0 && (
        <div className="space-y-2 pt-4">
          <h4 className="text-sm font-semibold">
            Added Research Papers ({data.artifacts.length})
          </h4>
          {data.artifacts.map((a: any) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-2 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800"
            >
              <FileTextIcon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm truncate mx-2 flex-1" title={a.title}>
                {a.title}
              </p>
              <button
                onClick={() =>
                  setData({
                    ...data,
                    artifacts: data.artifacts.filter(
                      (art: any) => art.id !== a.id
                    ),
                  })
                }
                className="p-1 rounded-full hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700"
              >
                <TrashIcon className="w-4 h-4 text-status-danger" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Step4_Review = ({ data }: { data: any }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Review & Create</h3>
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800">
        <p className="font-bold">{data.title}</p>
        <p className="text-sm">{data.description}</p>
        <p className="text-sm mt-2">
          <b>Domain:</b> {data.domain} | <b>License:</b> {data.license}
        </p>
      </div>
      <div>
        <h4 className="font-semibold">HF Outputs ({data.outputs.length})</h4>
        {data.outputs.map(
          (
            o: any // Changed type
          ) => (
            <p key={o.id} className="text-sm">
              - {o.name}
            </p>
          )
        )}
      </div>
      <div>
        <h4 className="font-semibold">
          Research Papers ({data.artifacts.length})
        </h4>
        {data.artifacts.map((a: any) => (
          <p key={a.id} className="text-sm">
            - {a.title}
          </p>
        ))}
      </div>
    </div>
  </div>
);

export const CreateProjectWizardModal = ({
  initialOutputs,
  onClose,
}: {
  initialOutputs: any[];
  onClose: () => void;
}) => {
  const { addToast } = useAppContext();
  const api = useApi();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [wizardData, setWizardData] = React.useState({
    outputs: initialOutputs,
    title:
      initialOutputs[0]?.name
        .replace(/-/g, " ")
        .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()) ||
      "",
    description: `An open-source project based on the ${initialOutputs[0]?.name} ${initialOutputs[0]?.type}.`,
    domain: "robotics", // Changed from ResearchDomain.Robotics to string
    license: "MIT",
    artifacts: [],
    reproducibilityChecks: [],
  });

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const projectData = {
        title: wizardData.title,
        description: wizardData.description,
        field: wizardData.domain,
        // Just send the URL as publication_url
        publication_url:
          wizardData.artifacts.length > 0
            ? wizardData.artifacts[0].url
            : undefined,
        huggingface: wizardData.outputs[0]
          ? {
              repository_url: wizardData.outputs[0].huggingfaceUrl,
              license: wizardData.license,
            }
          : undefined,
      };

      console.log("Sending project data:", projectData);

      const createdProject = await api.createProject(projectData);

      addToast(`Project "${createdProject.title}" created successfully!`);
      onClose();
    } catch (error: any) {
      console.error("Failed to create project:", error);
      addToast(error.message || "Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_SelectedOutputs
            outputs={wizardData.outputs}
            onRemove={(id) =>
              setWizardData({
                ...wizardData,
                outputs: wizardData.outputs.filter((o) => o.id !== id),
              })
            }
          />
        );
      case 2:
        return (
          <Step2_ProjectBasics data={wizardData} setData={setWizardData} />
        );
      case 3:
        return (
          <Step3_AddResearchPapers data={wizardData} setData={setWizardData} />
        );
      case 4:
        return <Step4_Review data={wizardData} />;
      default:
        return null;
    }
  };

  return (
    <Modal onClose={onClose} title="">
      <div className="p-4 border-b border-border dark:border-border-dark">
        <WizardStepper currentStep={currentStep} />
      </div>
      <div className="flex p-6">
        <div className="flex-1 pr-6 border-r border-border dark:border-border-dark">
          {renderStepContent()}
        </div>
        <HelpRail step={currentStep} />
      </div>
      <div className="flex justify-between items-center p-4 border-t border-border dark:border-border-dark bg-hf-gray-50 dark:bg-hf-gray-900/50 rounded-b-2xl">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 font-semibold py-2 px-4 rounded-lg"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {currentStep === 4 ? (
            <>
              <button
                onClick={onClose}
                className="font-semibold py-2 px-4 rounded-lg"
              >
                Save Draft
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center"
              >
                {isSubmitting && (
                  <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Project
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              disabled={!wizardData.title}
              className="flex items-center space-x-2 font-semibold py-2 px-4 rounded-lg bg-primary text-white disabled:bg-hf-gray-400"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
