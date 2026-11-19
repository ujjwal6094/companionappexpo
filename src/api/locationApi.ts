import axios from 'axios';
import { LocationPayload } from '../types/location';
import { getUserConfig } from '../storage/storage';

export const postLocation = async (payload: LocationPayload): Promise<void> => {
  const config = await getUserConfig();

  const apiBaseUrl = payload.apiUrl || config?.apiBaseUrl;
  const authToken = payload.authToken || config?.authToken;

  if (!apiBaseUrl || !authToken) {
    throw new Error('API Base URL or Auth Token missing');
  }

  // Strip non-Maximo metadata fields before posting and prune any null/undefined fields
  const { apiUrl: _url, authToken: _token, ...rawPayload } = payload;
  const maximoPayload: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawPayload)) {
    if (val !== undefined && val !== null && val !== 'null' && val !== 'undefined') {
      maximoPayload[key] = val;
    }
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
  console.log(`[LocationApi] Final Payload:`, JSON.stringify(maximoPayload));

  try {
    const res = await axios.post(fetchUrl, maximoPayload, {
      headers,
      timeout: 10000,
    });

    console.log(`[LocationApi] Maximo Response Status: ${res.status}`);
    if (res.data) {
      console.log(`[LocationApi] Maximo Response Data: ${JSON.stringify(res.data)}`);
    }
  } catch (err: any) {
    if (apiBaseUrl.includes('httpbin.org') || apiBaseUrl === 'demo') {
      console.log('[LocationApi] Demo mode: simulated successful upload');
      return;
    }
    const errData = err.response?.data ? JSON.stringify(err.response.data) : '';
    console.error(`[LocationApi] Request failed (${err.response?.status || 'No status'}): ${err.message} ${errData}`);
    throw err;
  }
};
