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

  // Filecoin
  downloadFilecoinFile: (cid: string, filename?: string) => Promise<void>;
  getFilecoinFileInfo: (cid: string) => Promise<{
    cid: string;
    downloadUrl: string;
    estimatedFilename: string;
  }>;
  checkFilecoinHealth: () => Promise<{ status: string; initialized: boolean }>;

  // Users (admin only)
  fetchAllUsers: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<{ users: ApiUserProfile[]; pagination: any }>;

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

  // Filecoin functions
  const downloadFilecoinFile = async (
    cid: string,
    filename?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filename) params.append("filename", filename);

      const response = await fetch(
        `${API_BASE}/filecoin/download/${cid}?${params}`,
        {
          method: "GET",
          // Remove Content-Type header for downloads to avoid issues
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Download failed");
      }

      // Check if the response is actually binary data
      const contentType = response.headers.get("content-type");
      console.log("Response content-type:", contentType);
      console.log("Response size:", response.headers.get("content-length"));

      // Get filename from response headers or use provided/default
      const contentDisposition = response.headers.get("content-disposition");
      let downloadFilename = filename;

      if (!downloadFilename && contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        downloadFilename = match ? match[1] : `file_${cid.slice(0, 8)}.zip`;
      } else if (!downloadFilename) {
        downloadFilename = `file_${cid.slice(0, 8)}.zip`;
      }

      // Use arrayBuffer for binary data to avoid corruption
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: "application/octet-stream",
      });

      console.log("Downloaded blob size:", blob.size);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      handleApiError(error, "Failed to download file from Filecoin");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getFilecoinFileInfo = async (cid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/filecoin/info/${cid}`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<{
        cid: string;
        downloadUrl: string;
        estimatedFilename: string;
      }> = await response.json();

      if (data.status === "success" && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to get file info");
      }
    } catch (error: any) {
      handleApiError(error, "Failed to get Filecoin file info");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkFilecoinHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/filecoin/health`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<{
        initialized: boolean;
        timestamp: string;
      }> = await response.json();

      if (data.status === "success" && data.data) {
        return {
          status: data.status,
          initialized: data.data.initialized,
        };
      } else {
        throw new Error(data.message || "Health check failed");
      }
    } catch (error: any) {
      handleApiError(error, "Filecoin health check failed");
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
    downloadFilecoinFile,
    getFilecoinFileInfo,
    checkFilecoinHealth,
    fetchAllUsers,
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
