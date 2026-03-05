/**
 * API Configuration
 * ใช้ environment variables จาก .env
 */

import Constants from 'expo-constants';

interface ApiConfig {
  baseUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  enableSync: boolean;
  enableOfflineMode: boolean;
  debugApi: boolean;
}

function getEnvVar(key: string, defaultValue: string = ''): string {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
}

function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1';
}

export const apiConfig: ApiConfig = {
  baseUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'https://api.sandboxedu.app'),
  version: getEnvVar('EXPO_PUBLIC_API_VERSION', 'v1'),
  environment: getEnvVar('EXPO_PUBLIC_ENV', 'development') as any,
  enableSync: getBoolEnvVar('EXPO_PUBLIC_ENABLE_SYNC', true),
  enableOfflineMode: getBoolEnvVar('EXPO_PUBLIC_ENABLE_OFFLINE_MODE', true),
  debugApi: getBoolEnvVar('EXPO_PUBLIC_DEBUG_API', false),
};

export function getApiUrl(endpoint: string): string {
  const base = apiConfig.baseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

if (apiConfig.debugApi) {
  console.log('🔧 API Config:', apiConfig);
}
