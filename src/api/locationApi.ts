import axios from 'axios';
import { LocationPayload } from '../types/location';
import { getUserConfig } from '../storage/storage';

export const postLocation = async (payload: LocationPayload): Promise<void> => {
  const config = await getUserConfig();
  if (!config) {
    throw new Error('User config not found');
  }

  const { apiBaseUrl, authToken } = config;

  if (!apiBaseUrl || !authToken) {
    throw new Error('API Base URL or Auth Token missing');
  }

  // Use the API URL exactly as provided, removing any trailing slash
  const endpoint = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  console.log(`[LocationApi] Using API Key (length ${authToken.length}): ${authToken.substring(0, 5)}...`);

  let fetchUrl = endpoint;

  // Set apikey header
  headers['apikey'] = authToken;

  // Also include apikey in URL query string (ensures backwards compatibility with existing working behavior)
  if (!fetchUrl.includes('apikey=')) {
    const hasQuery = fetchUrl.includes('?');
    fetchUrl = `${fetchUrl}${hasQuery ? '&' : '?'}apikey=${encodeURIComponent(authToken)}`;
  }

  // Ensure lean=1 is added for Maximo JSON format without duplicating
  if (!fetchUrl.includes('lean=1')) {
    fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}lean=1`;
  }

  console.log(`[LocationApi] Final POST URL: ${fetchUrl}`);
  console.log(`[LocationApi] Final Payload:`, JSON.stringify(payload));

  try {
    const res = await axios.post(fetchUrl, payload, {
      headers,
      timeout: 10000,
    });

    console.log(`[LocationApi] Maximo Response Status: ${res.status}`);
    if (res.data) {
      console.log(`[LocationApi] Maximo Response Data: ${JSON.stringify(res.data)}`);
    }
  } catch (err: any) {
    const errData = err.response?.data ? JSON.stringify(err.response.data) : '';
    console.error(`[LocationApi] Request failed (${err.response?.status || 'No status'}): ${err.message} ${errData}`);
    throw err;
  }
};
