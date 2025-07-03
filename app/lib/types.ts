import type { Client } from "@web3-storage/w3up-client";

export enum UserRole {
  Scientist = "Scientist",
  Funder = "Funder",
}

export enum ProjectStatus {
  Draft = "Draft",
  Active = "Active",
  Funded = "Funded",
  Archived = "Archived",
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
  reproducibilities: ProofOfReproducibility[];
  fundingGoal?: number;
  fundingPool: number;
  impactScore: number;
  outputs: Output[];
  reproducibilityRequirements: string[];
  organization?: string;
  additionalInfoUrl?: string;
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
    ipfsCid?: string;
    fileName?: string;
    tools?: ToolOption[];
    otherText?: string;
  };
}

export interface ToastInfo {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export interface UserProfile {
  walletAddress: string;
  porContributedCount: number;
  role: UserRole;
}

export interface FundingEvent {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  timestamp: string;
}

export interface ProjectRegistration {
  title: string;
  description: string;
  created_at: string;
  owner_address: string;
  organization: string;
  url: string;
}

export type Tools =
  | "Python"
  | "R"
  | "JavaScript"
  | "SQL"
  | "Java"
  | "C++"
  | "Go"
  | "Rust";

export interface ProjectOutput {
  paper_url: string;
  description: string;
  resources: {
    dataset_url: string;
    code_url: string;
    code_output_url: string;
  };
  tools: {
    tools: Tools[];
    other_tools?: string[];
  };
}

export interface ProofOfReproducibility {
  project_id: string;
  timestamp: string;
  description: string;
  code_url: string;
  output_url: string;
  video_url?: string;
}

export interface IpfsClient extends Client {
  isInitialized: boolean;
}
