import { createApiClient, validateApiBaseUrl } from 'api-contracts';

// Deliberately opt-in. Existing demo state and screens do not call the API.
export function getApiClient() {
  return createApiClient(validateApiBaseUrl(process.env.NEXT_PUBLIC_API_URL));
}
