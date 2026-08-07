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

  let fetchUrl = endpoint;
  const hasQuery = endpoint.includes('?');
  
  if (authToken.length < 40 && !authToken.includes('-') && /^[A-Za-z0-9+/=]+$/.test(authToken)) {
    headers['maxauth'] = authToken;
  } else {
    // Append the API key directly in the URL query string
    fetchUrl = `${endpoint}${hasQuery ? '&' : '?'}apikey=${encodeURIComponent(authToken)}`;
  }

  await axios.post(fetchUrl, payload, {
    headers,
    timeout: 10000,
  });
};
