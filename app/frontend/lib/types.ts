// ===== FRONTEND TYPES =====
export enum UserRole {
  Researcher = "Researcher",
  Funder = "Funder",
  ImpactOwner = "Impact Owner",
}

export enum ProjectStatus {
  Draft = "Draft",
  PendingEvaluation = "Pending Evaluation",
  Reproducible = "Reproducible",
  InReview = "In Review",
  Funded = "Funded",
}

export enum ResearchDomain {
  Robotics = "Robotics",
  Simulation = "Simulation",
  Hardware = "Hardware",
}

export enum PoRStatus {
  Waiting = "Waiting",
  Disputed = "Disputed",
  Success = "Success",
}

export interface ImpactAssetOwner {
  walletAddress: string;
  contribution: string;
  ownershipPercentage: number;
  claimed?: boolean;
}

export interface Metric {
  value: number;
  trend: number; // percentage change
}

export interface AdoptionMetrics {
  githubStars: Metric;
  githubForks: Metric;
  dependencies: Metric;
  huggingFaceDownloads: Metric;
  huggingFaceModels?: string[];
  huggingFaceDatasets?: string[];
  huggingFaceSpaces?: string[];
}

export interface ScientificMetrics {
  citations: Metric;
  arxivDownloads: Metric;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  domain: ResearchDomain;
  coverImageUrl?: string;
  cid: string;
  hypercertFraction: number;
  startDate: string;
  endDate: string;
  lastOutputDate: string;
  reproducibilities: Reproducibility[];
  fundingPool: number;
  fundingPrice?: number;
  impactScore: number;
  outputs: Output[];
  reproducibilityRequirements: string[];
  organization?: string;
  additionalInfoUrl?: string;
  impactAssetOwners: ImpactAssetOwner[];
  scientificMetrics?: ScientificMetrics;
  adoptionMetrics?: AdoptionMetrics;
  stars?: number;
  license?: string;
}

export const TOOL_OPTIONS = [
  "Python",
  "ROS",
  "MuJoCo",
  "AWS",
  "BitRobot",
] as const;
export type ToolOption = (typeof TOOL_OPTIONS)[number];

export type OutputType =
  | "Document"
  | "Dataset"
  | "Code"
  | "Tools & External Services"
  | "Output Log"
  | "Others"
  | "Video";

export interface Output {
  id: string;
  type: OutputType;
  timestamp: string;
  description: string;
  data: {
    url?: string;
    cid?: string;
    fileName?: string;
    tools?: ToolOption[];
    otherText?: string;
  };
  metrics?: {
    downloads: number;
    stars: number;
    citations: number;
  };
}

export interface Reproducibility {
  id: string;
  timestamp: string;
  evidence: Output[];
  notes: string;
  verifier: string; // wallet address
  status: PoRStatus;
}

export interface ToastInfo {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export interface UserProfile {
  walletAddress: string;
  porContributedCount: number;
  name: string;
  isVerified: boolean;
}

export interface FundingEvent {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  timestamp: string;
  funderWallet: string;
  txHash: string;
}

export interface Opportunity {
  id: string;
  issuer: string;
  amount: string;
  currency: string;
  title: string;
  deadline: string;
  isNew: boolean;
  url: string;
  creationDate?: string;
}

export interface RoundApplicant {
  projectId: string;
  projectTitle: string;
  verifiedPors: number;
  impactLevel: "High" | "Medium" | "Low";
  hfUpvotes: number;
  communityScore: number;
  fundingPercentage?: number;
  fundingAmount?: number;
}

export interface FundingRound {
  id: string;
  title: string;
  description: string;
  poolSize: number;
  topics: string[];
  applicationDeadline: string;
  status: "Open" | "Voting" | "Closed";
  applicationCount: number;
  totalImpactScore: number;
  applicants?: RoundApplicant[];
  evaluationMethod?: "Delegated Evaluators" | "Cairn Core" | "DAO Vote";
  selectionCriteria?: string;
  evaluationDeadline: string;
  distributionDeadline: string;
  distributionMethod: "Even" | "By Score" | "Manual";
  maxProjects?: number;
  funderName?: string;
  creationDate?: string;
  impactAssetMinted?: boolean;
}

export interface Notification {
  id: string;
  type:
    | "deadline"
    | "review_needed"
    | "new_submission"
    | "impact_event"
    | "system_nudge"
    | "round_created";
  title: string;
  description: string;
  date: string; // ISO string
  relatedId: string; // project or round ID
  action?: {
    text: string;
    link?: string;
  };
}

// --- Outputs Library Types ---
export type ReproducibilityStatus = "Verified" | "Pending" | "Failed";
export type LibraryOutputType = "Model" | "Dataset" | "Paper" | "Space";

export interface LibraryOutput extends Output {
  projectName: string;
  projectId: string;
  projectOwnerName: string;
  projectTags: string[];
  libraryType: LibraryOutputType;
  metrics: {
    downloads: number;
    stars: number;
    citations: number;
  };
  reproducibility: ReproducibilityStatus;
  sourceUrl?: string;
  sourceType?: "GitHub" | "Hugging Face" | "ArXiv" | "Other";
}

export interface HuggingFaceOutput {
  id: string;
  type: "model" | "dataset" | "space";
  name: string;
  downloads: number;
  likes: number;
  lastModified: string;
  private: boolean;
  status: "Not Imported" | "Imported" | "Pending Evaluation" | "Reproducible";
  cairnProjectId?: string;
}

// ===== BACKEND API TYPES =====

// Backend User types (from your server)
export interface ApiUserProfile {
  id: string;
  email?: string;
  username?: string;
  address?: string;
  role: "researcher" | "funder" | "admin";
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    orcid_id?: string;
  };
  permissions?: string[];
  isActive?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

// Backend Project types (from your server)
export interface ApiProject {
  _id: string;
  title: string;
  researcher_id: string;
  field: "llm" | "vision" | "nlp" | "robotics" | "ml" | "ai" | "other";
  paper?: {
    doi?: string;
    arxiv_id?: string;
    title?: string;
    abstract?: string;
  };
  huggingface?: {
    repo_url?: string;
    commit_hash?: string;
    files?: string;
    contents_cid?: string;
  };
  por?: {
    por_cid?: string;
  };
  researcher?: ApiUserProfile; // Populated field
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface SignupData {
  email: string;
  username: string;
  password: string;
  address?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    orcid_id?: string;
  };
}

export interface CreateProjectData {
  title: string;
  researcher_id: string;
  field: "llm" | "vision" | "nlp" | "robotics" | "ml" | "ai" | "other";
  paper?: {
    doi?: string;
    arxiv_id?: string;
    title?: string;
    abstract?: string;
  };
  huggingface?: {
    repo_url?: string;
    commit_hash?: string;
    files?: string;
  };
  por?: {
    por_cid?: string;
  };
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  status: "success" | "error";
  message?: string;
  data: {
    projects?: T[];
    users?: T[];
    pagination: {
      currentPage?: number;
      page?: number;
      totalPages?: number;
      pages?: number;
      totalProjects?: number;
      total?: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
      limit: number;
    };
  };
}
