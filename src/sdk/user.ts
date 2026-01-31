import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  getClockAccAddress,
  getFeePoolAccAddress,
  awaitComputationFinalization,
  RescueCipher,
  deserializeLE,
  x25519,
} from '@arcium-hq/client';
import type { RawSignals, UserSignals, ProofRequest, ProofOutput } from './types';
import { bucketSignals, hasAllSignals, signalsToArray } from './bucketing';
import { fetchSolanaSignals } from './signals/solana';
import { getTwitterAuthUrl } from './signals/twitter';
import { getGitHubAuthUrl } from './signals/github';
import { TWITTER_CLIENT_ID, GITHUB_CLIENT_ID } from '../lib/constants';
import { ARCIUM_CLUSTER_OFFSET } from '../lib/constants';

// Browser-compatible random bytes using Web Crypto API
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * AnonnUser - Client-side SDK for users to generate privacy-preserving proofs
 *
 * Usage:
 * ```ts
 * const user = new AnonnUser(connection);
 * user.setWallet(publicKey);
 * user.setProgram(program);
 *
 * // Collect signals
 * await user.collectWalletSignals();
 * await user.connectTwitter(); // Opens popup
 * await user.connectGitHub();  // Opens popup
 *
 * // Generate proof
 * const proof = await user.generateProof(proofRequest, provider);
 * ```
 */
export class AnonnUser {
  private connection: Connection;
  private program: anchor.Program | null = null;
  private wallet: PublicKey | null = null;

  // Collected raw signals
  private rawSignals: Partial<RawSignals> = {};

  // Bucketed signals (what gets encrypted)
  private bucketedSignals: Partial<UserSignals> = {};

  constructor(connection: Connection) {
    this.connection = connection;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setProgram(program: anchor.Program): void {
    this.program = program;
  }

  setWallet(publicKey: PublicKey): void {
    this.wallet = publicKey;
  }

  /**
   * Set bucketed signals from external state (e.g., React hook state)
   * This allows syncing signals collected via different methods
   */
  setBucketedSignals(signals: Partial<UserSignals>): void {
    this.bucketedSignals = { ...this.bucketedSignals, ...signals };
  }

  /**
   * Set raw signals from external state
   */
  setRawSignals(signals: Partial<RawSignals>): void {
    this.rawSignals = { ...this.rawSignals, ...signals };
  }

  // ============================================================================
  // Signal Collection
  // ============================================================================

  /**
   * Collect Solana wallet signals (transaction history)
   */
  async collectWalletSignals(): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not set');
    }

    const signals = await fetchSolanaSignals(this.connection, this.wallet);
    this.rawSignals = {
      ...this.rawSignals,
      ...signals,
    };
    this.bucketedSignals = bucketSignals(this.rawSignals);
  }


  connectTwitter(): Promise<boolean> {
    return new Promise((resolve) => {

      if (!TWITTER_CLIENT_ID) {
        console.error('Twitter client ID not configured');
        resolve(false);
        return;
      }

      // Open popup for Twitter OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      getTwitterAuthUrl()
        .then((authUrl) => {
          const popup = window.open(
            authUrl,
            'Twitter OAuth',
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!popup) {
            resolve(false);
            return;
          }

          // Listen for OAuth success message from popup
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
              return;
            }

            if (event.data.type === 'TWITTER_OAUTH_SUCCESS') {
              const createdAt = new Date(event.data.createdAt);
              this.rawSignals.twitterCreatedAt = createdAt;
              this.bucketedSignals = bucketSignals(this.rawSignals);
              window.removeEventListener('message', messageHandler);
              resolve(true);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.error('Twitter OAuth error:', event.data.error);
              window.removeEventListener('message', messageHandler);
              resolve(false);
            }
          };

          window.addEventListener('message', messageHandler);
        })
        .catch((err) => {
          console.error('Failed to build Twitter auth URL:', err);
          resolve(false);
        });
    });
  }

  /**
   * Connect GitHub account via OAuth popup
   * Returns true if successful
   */
  connectGitHub(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if GitHub client ID is configured
      if (!GITHUB_CLIENT_ID) {
        console.error('GitHub client ID not configured');
        resolve(false);
        return;
      }

      // Open popup for GitHub OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      getGitHubAuthUrl()
        .then((authUrl) => {
          const popup = window.open(
            authUrl,
            'GitHub OAuth',
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!popup) {
            resolve(false);
            return;
          }

          // Listen for OAuth success message from popup
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
              return;
            }

            if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
              const createdAt = new Date(event.data.createdAt);
              this.rawSignals.githubCreatedAt = createdAt;
              this.rawSignals.githubPublicRepos = event.data.publicRepos;
              this.bucketedSignals = bucketSignals(this.rawSignals);
              window.removeEventListener('message', messageHandler);
              resolve(true);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.error('GitHub OAuth error:', event.data.error);
              window.removeEventListener('message', messageHandler);
              resolve(false);
            }
          };

          window.addEventListener('message', messageHandler);
        })
        .catch((err) => {
          console.error('Failed to build GitHub auth URL:', err);
          resolve(false);
        });
    });
  }

  /**
   * Get current raw signals (for display/debugging)
   */
  getRawSignals(): Partial<RawSignals> {
    return { ...this.rawSignals };
  }

  /**
   * Get current bucketed signals (for display)
   */
  getBucketedSignals(): Partial<UserSignals> {
    return { ...this.bucketedSignals };
  }

  /**
   * Check if all signals are collected
   */
  hasAllSignals(): boolean {
    return hasAllSignals(this.bucketedSignals);
  }

  // ============================================================================
  // Proof Generation
  // ============================================================================

  /**
   * Generate a privacy-preserving proof
   */
  async generateProof(
    proofRequest: ProofRequest,
    provider: anchor.AnchorProvider
  ): Promise<ProofOutput> {
    if (!this.program) {
      throw new Error('Program not set. Call setProgram() first.');
    }

    if (!this.wallet) {
      throw new Error('Wallet not set. Call setWallet() first.');
    }

    if (!hasAllSignals(this.bucketedSignals)) {
      throw new Error('Not all signals collected. Connect all signal sources first.');
    }

    const signals = this.bucketedSignals as UserSignals;
    const clusterOffset = ARCIUM_CLUSTER_OFFSET;

    console.log('[anonn] Starting proof generation...');
    console.log('[anonn] Program ID:', this.program.programId.toBase58());
    console.log('[anonn] Wallet:', this.wallet.toBase58());
    console.log('[anonn] Cluster offset:', clusterOffset);
    console.log('[anonn] Bucketed signals:', signals);

    // Get MXE public key for encryption
    console.log('[anonn] Fetching MXE public key...');
    const mxePublicKey = await this.getMXEPublicKeyWithRetry(provider);
    console.log('[anonn] MXE public key:', Buffer.from(mxePublicKey).toString('hex'));

    // Generate client keypair for decryption
    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);

    // Derive shared secret and create cipher
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Encrypt all signals in a single batch call (Enc<Shared, UserSignals> requires batch encryption)
    const nonce = randomBytes(16);
    const signalArray = signalsToArray(signals);
    const ciphertexts = cipher.encrypt(
      [
        BigInt(signalArray[0]),
        BigInt(signalArray[1]),
        BigInt(signalArray[2]),
        BigInt(signalArray[3]),
        BigInt(signalArray[4]),
      ],
      nonce
    );
    const encryptedSignals: [number[], number[], number[], number[], number[]] = [
      Array.from(ciphertexts[0]),
      Array.from(ciphertexts[1]),
      Array.from(ciphertexts[2]),
      Array.from(ciphertexts[3]),
      Array.from(ciphertexts[4]),
    ];

    console.log('[anonn] Signals encrypted successfully');
    console.log('[anonn] Ciphertext lengths:', encryptedSignals.map(s => s.length));

    // Generate computation offset
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');
    const epochBn = new anchor.BN(proofRequest.epoch);
    console.log('[anonn] Computation offset:', computationOffset.toString());
    console.log('[anonn] Epoch:', epochBn.toString());

    // Listen for proof result event
    let eventListenerId: number | null = null;
    const proofEventPromise = this.awaitProofEventWithId((id) => { eventListenerId = id; });

    const [proofPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('proof'),
        proofRequest.rulePda.toBuffer(),
        this.wallet.toBuffer(),
        epochBn.toArrayLike(Buffer, 'le', 8),
      ],
      this.program.programId
    );

    console.log('[anonn] Proof PDA:', proofPda.toBase58());
    console.log('[anonn] Rule PDA:', proofRequest.rulePda.toBase58());
    console.log('[anonn] Submitting requestProof transaction...');

    // Submit proof request
    await this.program.methods
      .requestProof(
        computationOffset,
        encryptedSignals.map((s) => s as unknown as number[]),
        Array.from(publicKey),
        new anchor.BN(deserializeLE(nonce).toString()),
        epochBn
      )
      .accountsPartial({
        payer: this.wallet,
        ruleAccount: proofRequest.rulePda,
        proofAccount: proofPda,
        computationAccount: getComputationAccAddress(
          clusterOffset,
          computationOffset
        ),
        clusterAccount: getClusterAccAddress(clusterOffset),
        mxeAccount: getMXEAccAddress(this.program.programId),
        mempoolAccount: getMempoolAccAddress(clusterOffset),
        executingPool: getExecutingPoolAccAddress(clusterOffset),
        compDefAccount: getCompDefAccAddress(
          this.program.programId,
          new DataView(getCompDefAccOffset('evaluate_rule').buffer).getUint32(0, true)
        ),
        poolAccount: getFeePoolAccAddress(),
        clockAccount: getClockAccAddress(),
      })
      .rpc({ skipPreflight: true, commitment: 'confirmed' });

    console.log('[anonn] requestProof transaction confirmed!');
    console.log('[anonn] Waiting for MPC computation to finalize...');

    // Wait for MPC computation
    await awaitComputationFinalization(
      provider,
      computationOffset,
      this.program.programId,
      'confirmed'
    );

    console.log('[anonn] MPC computation finalized!');

    // Race: try event listener OR poll the proof account directly
    // Event listeners use WebSocket which is unreliable in browsers
    const proofData = await Promise.race([
      proofEventPromise.then((event) => {
        console.log('[anonn] Proof event received via WebSocket');
        return {
          tier: event.tier as 0 | 1 | 2,
          conditionsMet: event.conditionsMet,
          epoch: event.epoch,
          ruleId: event.ruleId,
          generatedAt: event.generatedAt,
          expiresAt: event.expiresAt,
        };
      }),
      this.pollProofAccount(proofPda, proofRequest.ruleId),
    ]);

    // Clean up the event listener
    if (eventListenerId !== null) {
      try { this.program.removeEventListener(eventListenerId); } catch { /* ignore */ }
    }

    console.log('[anonn] Proof result:', proofData);

    return {
      ...proofData,
      proofPda,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Wait for proof generated event, exposing the listener ID for cleanup
   */
  private async awaitProofEventWithId(onListenerId: (id: number) => void): Promise<{
    ruleId: string;
    proofAccount: PublicKey;
    epoch: number;
    tier: number;
    conditionsMet: number;
    generatedAt: number;
    expiresAt: number;
  }> {
    if (!this.program) {
      throw new Error('Program not set');
    }

    return new Promise((resolve) => {
      const listenerId: number = this.program!.addEventListener(
        'proofGenerated',
        (event: {
          ruleId: string;
          proofAccount: PublicKey;
          epoch: anchor.BN;
          tier: number;
          conditionsMet: number;
          generatedAt: anchor.BN;
          expiresAt: anchor.BN;
        }) => {
          this.program!.removeEventListener(listenerId);
          resolve({
            ruleId: event.ruleId,
            proofAccount: event.proofAccount,
            epoch: event.epoch.toNumber(),
            tier: event.tier,
            conditionsMet: event.conditionsMet,
            generatedAt: event.generatedAt.toNumber(),
            expiresAt: event.expiresAt.toNumber(),
          });
        }
      );
      onListenerId(listenerId);
    });
  }

  /**
   * Poll the proof account on-chain until it exists (fallback for unreliable WebSocket events)
   */
  private async pollProofAccount(
    proofPda: PublicKey,
    ruleId: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<{
    tier: 0 | 1 | 2;
    conditionsMet: number;
    epoch: number;
    ruleId: string;
    generatedAt: number;
    expiresAt: number;
  }> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await (this.program!.account as any).proof.fetch(proofPda);
        if (account) {
          console.log('[anonn] Proof account found via polling');
          return {
            tier: account.tier as 0 | 1 | 2,
            conditionsMet: account.conditionsMet,
            epoch: account.epoch.toNumber ? account.epoch.toNumber() : account.epoch,
            ruleId,
            generatedAt: account.generatedAt.toNumber ? account.generatedAt.toNumber() : account.generatedAt,
            expiresAt: account.expiresAt.toNumber ? account.expiresAt.toNumber() : account.expiresAt,
          };
        }
      } catch {
        // Account doesn't exist yet, keep polling
      }
    }
    throw new Error('Proof account not found after polling. MPC computation may have failed.');
  }

  /**
   * Get MXE public key with retry logic
   */
  private async getMXEPublicKeyWithRetry(
    provider: anchor.AnchorProvider,
    maxRetries = 10,
    retryDelayMs = 500
  ): Promise<Uint8Array> {
    if (!this.program) {
      throw new Error('Program not set');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mxePublicKey = await getMXEPublicKey(provider, this.program.programId);

        if (!mxePublicKey) {
          throw new Error('MXE public key not available');
        }

        return mxePublicKey;
      } catch (error) {
        console.error(`Attempt ${attempt} failed to fetch MXE public key:`, error);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        } else {
          throw new Error(`Failed to fetch MXE public key after ${maxRetries} attempts`);
        }
      }
    }

    throw new Error('Failed to fetch MXE public key');
  }
}
