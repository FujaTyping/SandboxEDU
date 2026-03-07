/**
 * Global API Error Handler
 * จัดการ error ทั้งหมดจาก API calls พร้อม auto-retry
 */

import { Alert } from "react-native";
import { clearJwt } from "@/lib/auth/token";
import { router } from "expo-router";

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

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Global error handler
 */
export async function handleApiError(error: any, silent = false): Promise<void> {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Unauthorized - clear JWT and redirect to login
        await clearJwt();
        if (!silent) {
          Alert.alert(
            "กรุณาเข้าสู่ระบบใหม่",
            "เซสชันหมดอายุแล้ว",
            [{ text: "ตกลง", onPress: () => router.replace("/login") }]
          );
        }
        break;

      case 403:
        // Forbidden
        if (!silent) {
          Alert.alert("ไม่มีสิทธิ์เข้าถึง", "คุณไม่มีสิทธิ์ใช้งานฟีเจอร์นี้");
        }
        break;

      case 404:
        // Not found
        if (!silent) {
          Alert.alert("ไม่พบข้อมูล", "ข้อมูลที่ต้องการไม่มีในระบบ");
        }
        break;

      case 429:
        // Too many requests
        if (!silent) {
          Alert.alert(
            "ใช้งานบ่อยเกินไป",
            "กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
          );
        }
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        if (!silent) {
          Alert.alert(
            "เซิร์ฟเวอร์ขัดข้อง",
            "กรุณาลองใหม่อีกครั้งในภายหลัง"
          );
        }
        break;

      default:
        if (!silent) {
          Alert.alert(
            "เกิดข้อผิดพลาด",
            error.data?.message || error.message || "กรุณาลองใหม่อีกครั้ง"
          );
        }
    }
  } else if (error.message?.includes("Network request failed")) {
    if (!silent) {
      Alert.alert(
        "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
        "กรุณาตรวจสอบการเชื่อมต่อของคุณ"
      );
    }
  } else {
    if (!silent) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "กรุณาลองใหม่อีกครั้ง"
      );
    }
  }
}

/**
 * Fetch with auto-retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // ถ้า response ok หรือไม่ใช่ status ที่ควร retry ให้ return ทันที
      if (response.ok || !config.retryableStatuses.includes(response.status)) {
        return response;
      }

      // ถ้าเป็น status ที่ควร retry และยังมี attempt เหลือ
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await sleep(delay);
        continue;
      }

      // ถ้าหมด retry แล้วยัง error ให้ throw
      throw new ApiError(response.status, response.statusText);
    } catch (error: any) {
      lastError = error;

      // ถ้าเป็น network error และยังมี attempt เหลือ
      if (
        error.message?.includes("Network request failed") &&
        attempt < config.maxRetries
      ) {
        const delay = config.retryDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      // ถ้าไม่ใช่ network error หรือหมด retry แล้ว
      if (attempt >= config.maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Unknown error");
}

/**
 * API request wrapper with error handling and retry
 */
export async function apiRequestWithRetry<T = any>(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig,
  silentError = false
): Promise<T> {
  try {
    const response = await fetchWithRetry(url, options, retryConfig);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, response.statusText, errorData);
    }

    return await response.json();
  } catch (error) {
    await handleApiError(error, silentError);
    throw error;
  }
}
