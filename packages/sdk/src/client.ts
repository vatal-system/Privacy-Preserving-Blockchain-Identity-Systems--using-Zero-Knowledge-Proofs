/**
 * client.ts
 *
 * High-level Soroban contract interaction layer.
 *
 * Wraps the three deployed contracts:
 *   - IdentityRegistry  — register / look up username commitments
 *   - PaymentRouter     — send private payments
 *   - Groth16Verifier   — (read-only from SDK; called by PaymentRouter)
 *
 * Usage
 * -----
 *   const client = new ZKIdentityClient({ network: "testnet", ... });
 *   await client.register("alice", secret);
 *   await client.send("alice", amount, wasmPath, zkeyPath);
 */

import {
  Contract,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  xdr,
  Keypair,
  BASE_FEE,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { buildCommitment, generateSecret } from "./commitment";
import { generatePaymentProof } from "./proof";
import { deriveStealthAddress } from "./stealth";

export type Network = "mainnet" | "testnet" | "futurenet";

export interface ClientConfig {
  network: Network;
  /** Deployed contract addresses */
  contracts: {
    identityRegistry: string;
    paymentRouter: string;
  };
  /** Stellar keypair for signing transactions */
  keypair: Keypair;
}

const RPC_URLS: Record<Network, string> = {
  mainnet: "https://mainnet.sorobanrpc.com",
  testnet: "https://soroban-testnet.stellar.org",
  futurenet: "https://rpc-futurenet.stellar.org",
};

const NETWORK_PASSPHRASES: Record<Network, string> = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
  futurenet: Networks.FUTURENET,
};

export class ZKIdentityClient {
  private rpc: SorobanRpc.Server;
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
    this.rpc = new SorobanRpc.Server(RPC_URLS[config.network]);
  }

  /**
   * Register a username on-chain.
   *
   * Computes commitment = Poseidon(username, secret) locally, then calls
   * IdentityRegistry.register(commitment, nullifier).
   *
   * @param username  Human-readable username (3–31 bytes UTF-8).
   * @param secret    32-byte random secret. Store this securely — it cannot
   *                  be recovered if lost.
   */
  async register(username: string, secret: Uint8Array): Promise<string> {
    const { commitment, nullifier } = await buildCommitment(username, secret);

    const contract = new Contract(this.config.contracts.identityRegistry);
    const operation = contract.call(
      "register",
      nativeToScVal(Buffer.from(commitment), { type: "bytes" }),
      nativeToScVal(Buffer.from(nullifier), { type: "bytes" })
    );

    return this._submitTransaction(operation);
  }

  /**
   * Send a private payment to a recipient identified by their username.
   *
   * @param recipientUsername  Recipient's username.
   * @param recipientSecret    Recipient's registration secret (obtained out-of-band).
   * @param tokenAddress       SAC address of the token to send.
   * @param amount             Amount in the token's base unit.
   * @param wasmPath           Path to payment_proof.wasm (compiled circuit).
   * @param zkeyPath           Path to payment_proof.zkey (trusted setup).
   *
   * TODO: remove recipientSecret from this API once the circuit is updated to
   * use the recipient's public key instead (see stealth_address.circom).
   */
  async send(
    recipientUsername: string,
    recipientSecret: Uint8Array,
    tokenAddress: string,
    amount: bigint,
    wasmPath: string,
    zkeyPath: string
  ): Promise<string> {
    // 1. Look up recipient commitment
    const { commitment: recipientCommitment } = await buildCommitment(
      recipientUsername,
      recipientSecret
    );

    // 2. Derive stealth address
    const recipientPubKey = new Uint8Array(32); // TODO: fetch from registry
    const { stealthAddress, stealthAddressHash } =
      await deriveStealthAddress(recipientPubKey);

    // 3. Generate ZK proof
    const senderSecret = generateSecret();
    const proof = await generatePaymentProof(
      {
        recipientUsername,
        recipientSecret,
        senderSecret,
        recipientCommitment,
        stealthAddressHash,
        amount,
      },
      wasmPath,
      zkeyPath
    );

    // 4. Submit to PaymentRouter
    const stealthAccountId = Buffer.from(stealthAddress).toString("hex"); // TODO: encode as Stellar account ID
    const contract = new Contract(this.config.contracts.paymentRouter);
    const operation = contract.call(
      "send",
      nativeToScVal(tokenAddress, { type: "address" }),
      nativeToScVal(Buffer.from(recipientCommitment), { type: "bytes" }),
      nativeToScVal(stealthAccountId, { type: "address" }),
      nativeToScVal(Buffer.from(proof.proofBytes), { type: "bytes" }),
      // public_inputs as Vec<BytesN<32>>
      xdr.ScVal.scvVec(
        proof.publicInputs.map((b) =>
          nativeToScVal(Buffer.from(b), { type: "bytes" })
        )
      ),
      nativeToScVal(amount, { type: "i128" })
    );

    return this._submitTransaction(operation);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async _submitTransaction(operation: xdr.Operation): Promise<string> {
    const account = await this.rpc.getAccount(
      this.config.keypair.publicKey()
    );
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASES[this.config.network],
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const prepared = await this.rpc.prepareTransaction(tx);
    prepared.sign(this.config.keypair);

    const result = await this.rpc.sendTransaction(prepared);
    return result.hash;
  }
}
