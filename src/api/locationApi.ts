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
  const hasQuery = endpoint.includes('?');
  
  if (authToken.length < 40 && !authToken.includes('-') && /^[A-Za-z0-9+/=]+$/.test(authToken)) {
    headers['maxauth'] = authToken;
    console.log(`[LocationApi] Using maxauth header`);
  } else {
    // Append the API key directly in the URL query string like the original working code
    fetchUrl = `${endpoint}${hasQuery ? '&' : '?'}apikey=${encodeURIComponent(authToken)}`;
    console.log(`[LocationApi] Using apikey in URL query string`);
  }

  // Ensure lean=1 is added for the Maximo REST API JSON format
  fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}lean=1`;

  console.log(`[LocationApi] Final POST URL: ${fetchUrl}`);
  console.log(`[LocationApi] Final Payload:`, JSON.stringify(payload));
  console.log(`[LocationApi] Headers being sent:`, JSON.stringify(headers));

  const res = await axios.post(fetchUrl, payload, {
    headers,
    timeout: 10000,
  });
  
  console.log(`[LocationApi] Maximo Response Status: ${res.status}`);
  if (res.data) {
    console.log(`[LocationApi] Maximo Response Data: ${JSON.stringify(res.data)}`);
  }
};
