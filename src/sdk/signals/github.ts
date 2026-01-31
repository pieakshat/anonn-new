import { GITHUB_CLIENT_ID, OAUTH_REDIRECT_URI } from '../../lib/constants';

// ============================================================================
// GitHub OAuth Flow
// ============================================================================

/**
 * Generate GitHub OAuth authorization URL
 */
export async function getGitHubAuthUrl(): Promise<string> {
  // Generate random state for CSRF protection
  const state = generateRandomString(32);
  localStorage.setItem('github_oauth_state', state);

  // Generate code verifier for PKCE
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await base64UrlEncode(await sha256(codeVerifier));
  localStorage.setItem('github_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_URI}/github`,
    scope: 'read:user user:email',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Fetch GitHub user data via backend proxy
 */
export async function fetchGitHubUser(accessToken: string): Promise<{
  createdAt: Date;
  publicRepos: number;
  username?: string;
}> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/github/user` : '/api/github/user';

  // Fetch user profile via backend proxy
  const userResponse = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const error = await userResponse.json().catch(() => ({ error: userResponse.statusText }));
    throw new Error(`GitHub user fetch failed: ${error.error || userResponse.statusText}`);
  }

  const user = await userResponse.json();

  // GitHub provides created_at as a string like "2010-05-01T00:00:00Z"
  const createdAt = new Date(user.created_at);

  return {
    createdAt,
    publicRepos: user.public_repos || 0,
    username: user.login,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
 * Format GitHub account age for display
 */
export function formatGitHubAge(createdAt: Date): string {
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

/**
 * Format repository count for display
 */
export function formatRepoCount(count: number): string {
  if (count === 0) {
    return 'No public repos';
  } else if (count < 10) {
    return `${count} repos`;
  } else if (count < 50) {
    return `${count} repos`;
  } else if (count < 200) {
    return `${count} repos`;
  } else {
    return `${count}+ repos`;
  }
}
