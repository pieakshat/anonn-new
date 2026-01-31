import { TWITTER_CLIENT_ID, OAUTH_REDIRECT_URI } from '../../lib/constants';

// ============================================================================
// Twitter OAuth Flow
// ============================================================================

/**
 * Generate Twitter OAuth authorization URL using PKCE
 */
export async function getTwitterAuthUrl(): Promise<string> {
  // Generate random state for CSRF protection
  const state = generateRandomString(32);
  localStorage.setItem('twitter_oauth_state', state);

  // Generate code verifier for PKCE
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await base64UrlEncode(await sha256(codeVerifier));

  localStorage.setItem('twitter_code_verifier', codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_URI}/twitter`,
    scope: 'tweet.read users.read',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://x.com/i/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token via backend
 */
export async function exchangeTwitterCode(
  _clientId: string,
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<string> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!apiBaseUrl) {
    throw new Error('API base URL not configured');
  }

  const response = await fetch(`${apiBaseUrl}/api/twitter/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twitter token exchange failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch Twitter user data via backend proxy
 */
export async function fetchTwitterUser(accessToken: string): Promise<{
  createdAt: Date;
  username?: string;
}> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/twitter/user` : '/api/twitter/user';

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Twitter user fetch failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  const user = data.data;

  // Twitter provides created_at as a string like "2010-05-01T00:00:00Z"
  const createdAt = new Date(user.created_at);

  return {
    createdAt,
    username: user.username,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

async function base64UrlEncode(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Format Twitter account age for display
 */
export function formatTwitterAge(createdAt: Date): string {
  const days = Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));

  if (days < 30) {
    return `${days} days`;
  } else if (days < 90) {
    return `${Math.floor(days / 30)} month${days > 30 ? 's' : ''}`;
  } else if (days < 365) {
    return `${Math.floor(days / 90)} quarter${days > 90 ? 's' : ''}`;
  } else if (days < 730) {
    return '1 year';
  } else {
    return `${Math.floor(days / 365)} years`;
  }
}
