import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Raw Signals (fetched from sources, before bucketing)
// ============================================================================

export interface RawSignals {
  walletCreatedAt?: Date;
  txCount?: number;
  twitterCreatedAt?: Date;
  githubCreatedAt?: Date;
  githubPublicRepos?: number;
}

// ============================================================================
// User Signals (bucketed, privacy-preserving)
// ============================================================================

/**
 * Age buckets for wallet/social accounts (coarse-grained for privacy)
 * 0: < 30 days
 * 1: 30-90 days
 * 2: 90-180 days
 * 3: 180-365 days
 * 4: 1-2 years
 * 5: > 2 years
 */
export type AgeBucket = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Count buckets for transactions/repos (coarse-grained for privacy)
 * 0: 0
 * 1: 1-10
 * 2: 11-50
 * 3: 51-200
 * 4: > 200
 */
export type CountBucket = 0 | 1 | 2 | 3 | 4;

/**
 * User's bucketed signals - these are what get encrypted and sent to MPC
 */
export interface UserSignals {
  walletAgeBucket: AgeBucket;
  txCountBucket: CountBucket;
  twitterAgeBucket: AgeBucket;
  githubAgeBucket: AgeBucket;
  githubRepoBucket: CountBucket;
}

// Partial version for collection in progress
export type PartialUserSignals = Partial<UserSignals>;

// ============================================================================
// Rule Definition
// ============================================================================

export interface RuleDefinition {
  ruleId: string;
  walletAgeThreshold: AgeBucket;
  txCountThreshold: CountBucket;
  twitterAgeThreshold: AgeBucket;
  githubAgeThreshold: AgeBucket;
  githubRepoThreshold: CountBucket;
  tier1Min: number;
  tier2Min: number;
  proofValiditySecs?: number;
}

export interface Rule {
  id: string;
  authority: PublicKey;
  thresholds: {
    walletAgeThreshold: AgeBucket;
    txCountThreshold: CountBucket;
    twitterAgeThreshold: AgeBucket;
    githubAgeThreshold: AgeBucket;
    githubRepoThreshold: CountBucket;
  };
  tierConfig: {
    tier1Min: number;
    tier2Min: number;
  };
  proofValiditySecs: number;
  createdAt: number;
}

// ============================================================================
// Proof Request & Output
// ============================================================================

export interface ProofRequest {
  ruleId: string;
  rulePda: PublicKey;
  epoch: number;
}

export interface ProofOutput {
  tier: 0 | 1 | 2;
  conditionsMet: number;
  epoch: number;
  proofPda?: PublicKey;
  expiresAt?: number;
  generatedAt?: number;
  ruleId?: string;
}

// ============================================================================
// On-chain Proof Record
// ============================================================================

export interface ProofRecord {
  owner: PublicKey;
  rule: PublicKey;
  epoch: number;
  tier: 0 | 1 | 2;
  conditionsMet: number;
  generatedAt: number;
  expiresAt: number;
  isFinalized: boolean;
}

export interface VerifyResult {
  valid: boolean;
  tier: 0 | 1 | 2;
  expired: boolean;
}

// ============================================================================
// Proof Status
// ============================================================================

export type ProofStatus = 'idle' | 'collecting' | 'encrypting' | 'computing' | 'completed' | 'error';

// ============================================================================
// Solana Event Types (from IDL)
// ============================================================================

export interface RuleRegisteredEvent {
  ruleId: string;
  authority: PublicKey;
  proofValiditySecs: number;
}

export interface ProofGeneratedEvent {
  ruleId: string;
  proofAccount: PublicKey;
  epoch: number;
  tier: number;
  conditionsMet: number;
  generatedAt: number;
  expiresAt: number;
}
