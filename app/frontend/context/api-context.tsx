// context/api-context.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

import {
  ApiUserProfile,
  ApiProject,
  SignupData,
  CreateProjectData,
  ApiResponse,
  PaginatedResponse,
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

interface HFRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  likes: number;
  tags: string[];
}

interface HFDataset {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  likes: number;
  tags: string[];
}

interface ApiContextType {
  // Auth
  loginUser: (email: string, password: string) => Promise<ApiUserProfile>;
  signupUser: (userData: SignupData) => Promise<ApiUserProfile>;
  getCurrentUser: () => Promise<ApiUserProfile>;
  logoutUser: () => void;

  // Projects
  fetchProjects: (params?: {
    page?: number;
    limit?: number;
    field?: string;
    researcher_id?: string;
  }) => Promise<{ projects: ApiProject[]; pagination: any }>;
  getProjectById: (id: string) => Promise<ApiProject>;
  getProjectsByField: (
    field: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => Promise<{ projects: ApiProject[]; pagination: any }>;
  createProject: (projectData: CreateProjectData) => Promise<ApiProject>;

  // Users (admin only)
  fetchAllUsers: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<{ users: ApiUserProfile[]; pagination: any }>;

  // HuggingFace Integration
  initiateHFAuth: () => Promise<{ authUrl: string }>;
  getHFStatus: () => Promise<HFStatus>;
  disconnectHF: () => Promise<void>;
  getHFRepos: (limit?: number) => Promise<HFRepo[]>;
  getHFDatasets: (limit?: number) => Promise<HFDataset[]>;
  refreshHFConnection: () => Promise<any>;

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

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Helper function to handle API errors
  const handleApiError = (error: any, defaultMessage: string) => {
    const errorMessage = error?.message || defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  };

  // Auth functions
  const loginUser = async (
    email: string,
    password: string
  ): Promise<ApiUserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<{
        user: ApiUserProfile;
        token: string;
        refreshToken: string;
      }> = await response.json();

      if (data.status === "success" && data.data) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refreshToken", data.data.refreshToken);
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

  const signupUser = async (userData: SignupData): Promise<ApiUserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending to backend:', userData);
      const response = await fetch(`${API_BASE}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data: ApiResponse<{
        user: ApiUserProfile;
        token: string;
        refreshToken: string;
      }> = await response.json();

      if (data.status === "success" && data.data) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refreshToken", data.data.refreshToken);
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

  const getCurrentUser = async (): Promise<ApiUserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<{ user: ApiUserProfile }> = await response.json();

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

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setError(null);
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
        headers: getAuthHeaders(),
      });

      const data: PaginatedResponse<ApiProject> = await response.json();

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

  const getProjectById = async (id: string): Promise<ApiProject> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<{ project: ApiProject }> = await response.json();

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
          headers: getAuthHeaders(),
        }
      );

      const data: PaginatedResponse<ApiProject> = await response.json();

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
  ): Promise<ApiProject> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
      });

      const data: ApiResponse<{ project: ApiProject }> = await response.json();

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

  // HuggingFace Integration functions
  const initiateHFAuth = async (): Promise<{ authUrl: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/integrations/huggingface/auth`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<{ authUrl: string }> = await response.json();

      if (data.success && data.authUrl) {
        return { authUrl: data.authUrl };
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
      const response = await fetch(`${API_BASE}/integrations/huggingface/status`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<HFStatus> = await response.json();

      if (data.success) {
        return data.connected ? data.data : { connected: false };
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
      const response = await fetch(`${API_BASE}/integrations/huggingface/disconnect`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<any> = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to disconnect HuggingFace");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to disconnect HuggingFace");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getHFRepos = async (limit: number = 20): Promise<HFRepo[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/integrations/huggingface/repos?limit=${limit}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data: ApiResponse<HFRepo[]> = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to get HuggingFace repositories");
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
          headers: getAuthHeaders(),
        }
      );

      const data: ApiResponse<HFDataset[]> = await response.json();

      if (data.success && data.data) {
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
      const response = await fetch(`${API_BASE}/integrations/huggingface/refresh`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<any> = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to refresh HuggingFace connection");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to refresh HuggingFace connection");
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
        headers: getAuthHeaders(),
      });

      const data: PaginatedResponse<ApiUserProfile> = await response.json();

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