/**
 * API Client
 * HTTP client พร้อม auth, error handling, และ offline detection
 */

import { getAuthToken } from "@/lib/db/auth";
import { apiConfig, getApiUrl } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "No internet connection") {
    super(message);
    this.name = "NetworkError";
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  skipAuthHeader?: boolean;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    requireAuth = false,
    skipAuthHeader = false,
    ...fetchOptions
  } = options;

  const url = getApiUrl(endpoint);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  if (!skipAuthHeader) {
    const token = await getAuthToken();
    if (token) {
      headers["authorization"] = token;
    } else if (requireAuth) {
      throw new ApiError(401, "Unauthorized", {
        message: "No auth token found",
      });
    }
  }

  if (apiConfig.debugApi) {
    console.log(`🌐 API ${fetchOptions.method || "GET"} ${endpoint}`, {
      headers,
      body: fetchOptions.body,
    });
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (apiConfig.debugApi) {
      console.log(`📥 Response ${response.status}`, endpoint);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, response.statusText, errorData);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return (await response.text()) as any;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error.message?.includes("Network request failed") ||
      error.name === "TypeError"
    ) {
      throw new NetworkError();
    }

    throw error;
  }
}

export const api = {
  courses: {
    getAll: () => apiRequest("/courses/all", { skipAuthHeader: true }),

    getById: (courseId: string) =>
      apiRequest(`/courses/${courseId}`, { requireAuth: true }),

    enroll: (courseId: string) =>
      apiRequest("/courses/enroll", {
        method: "POST",
        requireAuth: true,
        body: JSON.stringify({ id: courseId }),
      }),

    complete: (courseId: string) =>
      apiRequest("/courses/complete", {
        method: "POST",
        requireAuth: true,
        body: JSON.stringify({ id: courseId }),
      }),
  },

  quiz: {
    generate: (id: string, difficulty: "easy" | "medium" | "hard") =>
      apiRequest("/quiz/generate", {
        method: "POST",
        requireAuth: true,
        body: JSON.stringify({ id, difficulty }),
      }),

    complete: (id: string, correct: number, wrong: number) =>
      apiRequest("/quiz/complete", {
        method: "POST",
        requireAuth: true,
        body: JSON.stringify({ id, correct, wrong }),
      }),
  },

  users: {
    create: (data: {
      name: string;
      surname: string;
      displayName: string;
      avatarURL: string;
      sclass: number;
      room: number;
    }) =>
      apiRequest("/users/create", {
        method: "POST",
        skipAuthHeader: true,
        body: JSON.stringify(data),
      }),

    revalidate: (displayName: string) =>
      apiRequest("/users/revalidate", {
        method: "POST",
        skipAuthHeader: true,
        body: JSON.stringify({ displayName }),
      }),

    get: () => apiRequest("/users/get", { requireAuth: true }),

    edit: (field: string, value: string) =>
      apiRequest(`/users/edit/${field}`, {
        method: "PATCH",
        requireAuth: true,
        body: JSON.stringify({ value }),
      }),
  },
};

export { apiRequest };

