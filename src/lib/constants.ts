import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// Solana program configuration - new deployed program ID
export const PROGRAM_ID = new PublicKey('2Rg4mwwtnbF8jjM9wM5F8DKod8vhZHcSQiL3VhLVgDbw');

export const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as
  | 'devnet'
  | 'testnet'
  | 'mainnet-beta';
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet');

// Arcium cluster offset - configurable via environment variable
// Default is 0 for localnet/devnet
export const ARCIUM_CLUSTER_OFFSET = Number(import.meta.env.VITE_ARCIUM_CLUSTER_OFFSET || '0');

// Rule configuration (project-defined)
export const RULE_ID = import.meta.env.VITE_RULE_ID || '';
export const RULE_AUTHORITY = import.meta.env.VITE_RULE_AUTHORITY || '';

// Proof epoch configuration
export const PROOF_EPOCH_SECONDS = Number(import.meta.env.VITE_EPOCH_SECONDS || '86400'); // default: daily
export const PROOF_EPOCH_OVERRIDE = import.meta.env.VITE_EPOCH
  ? Number(import.meta.env.VITE_EPOCH)
  : null;

// OAuth configuration - set via environment variables
export const TWITTER_CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID || '';
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

// OAuth redirect URIs (must match your OAuth app settings)
export const OAUTH_REDIRECT_URI = `${window.location.origin}/oauth/callback`;

// Optional API base URL for backend token exchange
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
