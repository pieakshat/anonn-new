import type { RawSignals, UserSignals, AgeBucket, CountBucket, PartialUserSignals } from './types';

// ============================================================================
// Bucket Constants
// ============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

// Age bucket thresholds (in milliseconds)
const AGE_BUCKETS: [number, AgeBucket][] = [
  [30 * DAY_MS, 0],    // < 30 days
  [90 * DAY_MS, 1],    // 30-90 days
  [180 * DAY_MS, 2],   // 90-180 days
  [365 * DAY_MS, 3],   // 180-365 days
  [2 * 365 * DAY_MS, 4], // 1-2 years
  [Infinity, 5],       // > 2 years
];

// Count bucket thresholds
const COUNT_BUCKETS: [number, CountBucket][] = [
  [1, 0],       // 0
  [11, 1],      // 1-10
  [51, 2],      // 11-50
  [201, 3],     // 51-200
  [Infinity, 4], // > 200
];

// ============================================================================
// Bucketing Functions
// ============================================================================

/**
 * Convert a date (or account age in ms) to an age bucket
 */
export function dateToAgeBucket(createdAt: Date | undefined): AgeBucket | undefined {
  if (!createdAt) {
    return undefined;
  }

  const ageMs = Date.now() - createdAt.getTime();

  for (const [threshold, bucket] of AGE_BUCKETS) {
    if (ageMs < threshold) {
      return bucket;
    }
  }

  return 5; // Should never reach here due to Infinity
}

/**
 * Convert a count to a count bucket
 */
export function countToBucket(count: number | undefined): CountBucket | undefined {
  if (count === undefined || count === null) {
    return undefined;
  }

  for (const [threshold, bucket] of COUNT_BUCKETS) {
    if (count < threshold) {
      return bucket;
    }
  }

  return 4; // > 200
}

/**
 * Bucket raw signals into privacy-preserving coarse ranges
 */
export function bucketSignals(signals: Partial<RawSignals>): PartialUserSignals {
  const result: PartialUserSignals = {
    walletAgeBucket: dateToAgeBucket(signals.walletCreatedAt),
    txCountBucket: countToBucket(signals.txCount),
    twitterAgeBucket: dateToAgeBucket(signals.twitterCreatedAt),
    githubAgeBucket: dateToAgeBucket(signals.githubCreatedAt),
    githubRepoBucket: countToBucket(signals.githubPublicRepos),
  };

  return result;
}

/**
 * Check if all bucketed signals are present
 */
export function hasAllSignals(signals: PartialUserSignals): signals is UserSignals {
  return (
    signals.walletAgeBucket !== undefined &&
    signals.txCountBucket !== undefined &&
    signals.twitterAgeBucket !== undefined &&
    signals.githubAgeBucket !== undefined &&
    signals.githubRepoBucket !== undefined
  );
}

/**
 * Convert bucketed signals to array for encryption
 * Order matches the MPC circuit expectation:
 * [wallet_age, tx_count, twitter_age, github_age, github_repos]
 */
export function signalsToArray(signals: UserSignals): number[] {
  return [
    signals.walletAgeBucket,
    signals.txCountBucket,
    signals.twitterAgeBucket,
    signals.githubAgeBucket,
    signals.githubRepoBucket,
  ];
}

/**
 * Get a human-readable description of a bucket value
 */
export function describeAgeBucket(bucket: AgeBucket): string {
  const descriptions = [
    '< 30 days',
    '30-90 days',
    '90-180 days',
    '180-365 days',
    '1-2 years',
    '> 2 years',
  ];
  return descriptions[bucket];
}

export function describeCountBucket(bucket: CountBucket): string {
  const descriptions = [
    '0',
    '1-10',
    '11-50',
    '51-200',
    '> 200',
  ];
  return descriptions[bucket];
}
