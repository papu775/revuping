import { createApiClient, validateApiBaseUrl } from 'api-contracts';

// Expo requires static process.env access to inline public configuration.
// Deliberately opt-in: preserve all existing demo screens and local fixtures.
export function getApiClient() {
  return createApiClient(validateApiBaseUrl(process.env.EXPO_PUBLIC_API_URL));
}
