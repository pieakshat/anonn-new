import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  getCompDefAccOffset,
  getMXEAccAddress,
  getArciumAccountBaseSeed,
  getArciumProgramId,
  buildFinalizeCompDefTx,
} from '@arcium-hq/client';
import type { RuleDefinition, Rule, ProofRecord, VerifyResult } from './types';

/**
 * AnonnDeveloper - SDK for projects to register rules and verify proofs
 *
 * Usage:
 * ```ts
 * const developer = new AnonnDeveloper(connection, program, wallet);
 * await developer.initializeCompDef(payer);  // One-time setup
 * const rulePda = await developer.registerRule(ruleDefinition);
 * const isValid = await developer.verifyProof(proofPda, rulePda);
 * ```
 */
export class AnonnDeveloper {
  private connection: Connection;
  private program: anchor.Program;
  private authority: PublicKey;

  constructor(
    connection: Connection,
    program: anchor.Program,
    authority: PublicKey
  ) {
    this.connection = connection;
    this.program = program;
    this.authority = authority;
  }

  /**
   * Initialize the computation definition (one-time setup)
   */
  async initializeCompDef(payer: anchor.web3.Keypair): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
    const offset = getCompDefAccOffset('evaluate_rule');

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, this.program.programId.toBuffer(), offset],
      getArciumProgramId()
    )[0];

    const sig = await this.program.methods
      .initEvaluateRuleCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: payer.publicKey,
        mxeAccount: getMXEAccAddress(this.program.programId),
      })
      .signers([payer])
      .rpc({ commitment: 'confirmed' });

    // Finalize the computation definition
    const provider = this.program.provider as anchor.AnchorProvider;
    const finalizeTx = await buildFinalizeCompDefTx(
      provider,
      new DataView(offset.buffer).getUint32(0, true),
      this.program.programId
    );

    const latestBlockhash = await this.connection.getLatestBlockhash();
    finalizeTx.recentBlockhash = latestBlockhash.blockhash;
    finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    finalizeTx.sign(payer);
    await provider.sendAndConfirm(finalizeTx);

    return sig;
  }

  /**
   * Register a new verification rule
   */
  async registerRule(rule: RuleDefinition): Promise<PublicKey> {
    // Derive rule PDA
    const [rulePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('rule'),
        this.authority.toBuffer(),
        Buffer.from(rule.ruleId),
      ],
      this.program.programId
    );

    await this.program.methods
      .registerRule(
        rule.ruleId,
        rule.walletAgeThreshold,
        rule.txCountThreshold,
        rule.twitterAgeThreshold,
        rule.githubAgeThreshold,
        rule.githubRepoThreshold,
        rule.tier1Min,
        rule.tier2Min,
        new anchor.BN(rule.proofValiditySecs || 86400)
      )
      .accounts({
        authority: this.authority,
      })
      .rpc({ commitment: 'confirmed' });

    return rulePda;
  }

  /**
   * Get rule PDA address
   */
  getRulePda(ruleId: string): PublicKey {
    const [rulePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('rule'),
        this.authority.toBuffer(),
        Buffer.from(ruleId),
      ],
      this.program.programId
    );
    return rulePda;
  }

  /**
   * Fetch rule details from chain
   */
  async getRule(rulePda: PublicKey): Promise<Rule | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleAccount = await (this.program.account as any).rule.fetch(rulePda);
      return {
        id: ruleAccount.ruleId,
        authority: ruleAccount.authority,
        thresholds: {
          walletAgeThreshold: ruleAccount.walletAgeThreshold,
          txCountThreshold: ruleAccount.txCountThreshold,
          twitterAgeThreshold: ruleAccount.twitterAgeThreshold,
          githubAgeThreshold: ruleAccount.githubAgeThreshold,
          githubRepoThreshold: ruleAccount.githubRepoThreshold,
        },
        tierConfig: {
          tier1Min: ruleAccount.tier1Min,
          tier2Min: ruleAccount.tier2Min,
        },
        proofValiditySecs: ruleAccount.proofValiditySecs,
        createdAt: ruleAccount.createdAt,
      };
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Proof Verification
  // ============================================================================

  /**
   * Get proof PDA address for a user + rule combination
   */
  getProofPda(rulePda: PublicKey, userPubkey: PublicKey, epoch: number): PublicKey {
    const [proofPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('proof'),
        rulePda.toBuffer(),
        userPubkey.toBuffer(),
        new anchor.BN(epoch).toArrayLike(Buffer, 'le', 8),
      ],
      this.program.programId
    );
    return proofPda;
  }

  /**
   * Fetch proof record from chain
   */
  async getProof(proofPda: PublicKey): Promise<ProofRecord | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proofAccount = await (this.program.account as any).proof.fetch(proofPda);
      return {
        owner: proofAccount.owner,
        rule: proofAccount.rule,
        epoch: proofAccount.epoch.toNumber
          ? proofAccount.epoch.toNumber()
          : proofAccount.epoch,
        tier: proofAccount.tier,
        conditionsMet: proofAccount.conditionsMet,
        generatedAt: proofAccount.generatedAt.toNumber
          ? proofAccount.generatedAt.toNumber()
          : proofAccount.generatedAt,
        expiresAt: proofAccount.expiresAt.toNumber
          ? proofAccount.expiresAt.toNumber()
          : proofAccount.expiresAt,
        isFinalized: proofAccount.isFinalized ?? false,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify a proof on-chain (checks expiry and rule match)
   */
  async verifyProof(
    proofPda: PublicKey,
    rulePda: PublicKey,
    expectedEpoch: number
  ): Promise<VerifyResult> {
    try {
      await this.program.methods
        .verifyProof(new anchor.BN(expectedEpoch))
        .accounts({
          ruleAccount: rulePda,
          proofAccount: proofPda,
        })
        .rpc({ commitment: 'confirmed' });

      // If instruction succeeded, proof is valid
      const proof = await this.getProof(proofPda);
      return {
        valid: true,
        tier: proof?.tier ?? 0,
        expired: false,
      };
    } catch (err: unknown) {
      // Check if it's a ProofExpired error
      const proof = await this.getProof(proofPda);
      if (proof) {
        const now = Math.floor(Date.now() / 1000);
        return {
          valid: false,
          tier: proof.tier,
          expired: now >= proof.expiresAt,
        };
      }
      return { valid: false, tier: 0, expired: false };
    }
  }

  /**
   * Describe what tier a user would get based on conditions met
   */
  describeTier(conditionsMet: number, tier1Min: number, tier2Min: number): string {
    if (conditionsMet >= tier2Min) {
      return `Tier 2 (${conditionsMet}/${tier2Min} conditions met)`;
    } else if (conditionsMet >= tier1Min) {
      return `Tier 1 (${conditionsMet}/${tier1Min} conditions met)`;
    } else {
      return `Tier 0 (${conditionsMet} conditions met, need ${tier1Min} for Tier 1)`;
    }
  }
}
