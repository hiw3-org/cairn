// context/api-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import {
  SignupData,
  CreateProjectData,
  ApiResponse,
  PaginatedResponse,
  UserProfile,
  Project,
  HFModel,
  HFDataset,
} from "../lib/types";

// HuggingFace integration types
interface HFStatus {
  connected: boolean;
  username?: string;
  userId?: string;
  connectedAt?: string;
  lastSync?: string;
  scopes?: string[];
}

interface ApiContextType {
  // Auth
  loginUser: (email: string, password: string) => Promise<UserProfile>;
  signupUser: (userData: SignupData) => Promise<UserProfile>;
  getCurrentUser: () => Promise<UserProfile>;
  logoutUser: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;

  // Projects
  fetchProjects: (params?: {
    page?: number;
    limit?: number;
    field?: string;
    researcher_id?: string;
  }) => Promise<{ projects: Project[]; pagination: any }>;
  getProjectById: (id: string) => Promise<Project>;
  getProjectsByField: (
    field: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => Promise<{ projects: Project[]; pagination: any }>;
  createProject: (projectData: CreateProjectData) => Promise<Project>;

  // Users (admin only)
  fetchAllUsers: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<{ users: UserProfile[]; pagination: any }>;

  // HuggingFace Integration
  initiateHFAuth: () => Promise<{ authUrl: string }>;
  getHFStatus: () => Promise<HFStatus>;
  disconnectHF: () => Promise<void>;
  getHFRepos: (limit?: number) => Promise<HFModel[]>;
  getHFDatasets: (limit?: number) => Promise<HFDataset[]>;
  refreshHFConnection: () => Promise<any>;
  searchArxivByTitle: (query: string, limit?: number) => Promise<any>;
  searchArxivByAuthor: (author: string, limit?: number) => Promise<any>;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: React.ReactNode;
  apiUrl?: string;
}

export const ApiProvider = ({ children, apiUrl }: ApiProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE =
    apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

  // Helper function to get headers (no auth token needed anymore)
  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
    };
  };

  // Helper function to handle API errors
  const handleApiError = (error: any, defaultMessage: string) => {
    const errorMessage = error?.message || defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auth functions
  const loginUser = async (
    email: string,
    password: string
  ): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<{ user: UserProfile }> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data.user;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      handleApiError(error, "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupUser = async (userData: SignupData): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Sending to backend:", userData);
      const response = await fetch(`${API_BASE}/users/signup`, {
        method: "POST",
        credentials: "include", // Important: sends/receives cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data: ApiResponse<{ user: UserProfile }> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data.user;
      } else {
        throw new Error(data.message || "Signup failed");
      }
    } catch (error: any) {
      handleApiError(error, "Signup failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        credentials: "include", // Important: sends cookies
        headers: getHeaders(),
      });

      const data: ApiResponse<{ user: UserProfile }> = await response.json();

      console.log("Current user data:", data);

      if (data.status === "success" && data.data) {
        return data.data.user;
      } else {
        throw new Error(data.message || "Failed to get user");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to get user profile");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        credentials: "include",
        headers: getHeaders(),
      });

      if (response.ok) {
        const data: ApiResponse<{ user: UserProfile }> = await response.json();
        return data.status === "success";
      }
      return false;
    } catch (error) {
      console.log("Not authenticated");
      return false;
    }
  };

  const logoutUser = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/users/logout`, {
        method: "POST",
        credentials: "include",
        headers: getHeaders(),
      });
      // Note: No need to clear localStorage anymore
    } catch (error: any) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Projects functions
  const fetchProjects = async (params?: {
    page?: number;
    limit?: number;
    field?: string;
    researcher_id?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.field) searchParams.append("field", params.field);
      if (params?.researcher_id)
        searchParams.append("researcher_id", params.researcher_id);

      const response = await fetch(`${API_BASE}/projects?${searchParams}`, {
        credentials: "include", // Important: sends cookies
        headers: getHeaders(),
      });

      const data: PaginatedResponse<Project> = await response.json();

      if (data.status === "success" && data.data) {
        return {
          projects: data.data.projects || [],
          pagination: data.data.pagination,
        };
      } else {
        throw new Error("Failed to fetch projects");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to fetch projects");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectById = async (id: string): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        credentials: "include",
        headers: getHeaders(),
      });

      const data: ApiResponse<{ project: Project }> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data.project;
      } else {
        throw new Error(data.message || "Failed to fetch project");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to fetch project");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectsByField = async (
    field: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());

      const response = await fetch(
        `${API_BASE}/projects/field/${field}?${searchParams}`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: PaginatedResponse<Project> = await response.json();

      if (data.status === "success" && data.data) {
        return {
          projects: data.data.projects || [],
          pagination: data.data.pagination,
        };
      } else {
        throw new Error("Failed to fetch projects by field");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to fetch projects by field");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (
    projectData: CreateProjectData
  ): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify(projectData),
      });

      const data: ApiResponse<{ project: Project }> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data.project;
      } else {
        throw new Error(data.message || "Failed to create project");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to create project");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // HuggingFace Integration functions - all updated with credentials: "include"
  const initiateHFAuth = async (): Promise<{ authUrl: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/auth`,
        {
          method: "POST",
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<{ authUrl: string }> = await response.json();

      if (data.status === "success" && data.data && data.data.authUrl) {
        return { authUrl: data.data.authUrl };
      } else {
        throw new Error(data.message || "Failed to initiate HuggingFace auth");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to initiate HuggingFace authentication");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getHFStatus = async (): Promise<HFStatus> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/status`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<HFStatus> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to get HuggingFace status");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to get HuggingFace status");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectHF = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/disconnect`,
        {
          method: "DELETE",
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<any> = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to disconnect HuggingFace");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to disconnect HuggingFace");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getHFRepos = async (limit: number = 20): Promise<HFModel[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/repos?limit=${limit}`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<HFModel[]> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data;
      } else {
        throw new Error(
          data.message || "Failed to get HuggingFace repositories"
        );
      }
    } catch (error: any) {
      handleApiError(error, "Failed to get HuggingFace repositories");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getHFDatasets = async (limit: number = 20): Promise<HFDataset[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/datasets?limit=${limit}`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<HFDataset[]> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to get HuggingFace datasets");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to get HuggingFace datasets");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHFConnection = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: getHeaders(),
        }
      );

      const data: ApiResponse<any> = await response.json();

      if (data.status === "success") {
        return data.data;
      } else {
        throw new Error(
          data.message || "Failed to refresh HuggingFace connection"
        );
      }
    } catch (error: any) {
      handleApiError(error, "Failed to refresh HuggingFace connection");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const searchArxivByTitle = async (
    query: string,
    limit: number = 20
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/arxiv/search-title?q=${encodeURIComponent(
          query
        )}&limit=${limit}`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search arXiv");
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data.papers;
      } else {
        throw new Error(data.message || "Failed to search arXiv");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to search arXiv");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const searchArxivByAuthor = async (
    author: string,
    limit: number = 50
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/arxiv/search-author?author=${encodeURIComponent(
          author
        )}&limit=${limit}`,
        {
          credentials: "include",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search arXiv by author");
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data.papers;
      } else {
        throw new Error(data.message || "Failed to search arXiv by author");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to search arXiv by author");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin functions
  const fetchAllUsers = async (params?: { page?: number; limit?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());

      const response = await fetch(`${API_BASE}/users?${searchParams}`, {
        credentials: "include",
        headers: getHeaders(),
      });

      const data: PaginatedResponse<UserProfile> = await response.json();

      if (data.status === "success" && data.data) {
        return {
          users: data.data.users || [],
          pagination: data.data.pagination,
        };
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to fetch users");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: ApiContextType = {
    loginUser,
    signupUser,
    getCurrentUser,
    logoutUser,
    checkAuthStatus,
    fetchProjects,
    getProjectById,
    getProjectsByField,
    createProject,
    fetchAllUsers,
    initiateHFAuth,
    getHFStatus,
    disconnectHF,
    getHFRepos,
    getHFDatasets,
    refreshHFConnection,
    isLoading,
    error,
    searchArxivByTitle,
    searchArxivByAuthor,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
