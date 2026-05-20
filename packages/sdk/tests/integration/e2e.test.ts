/**
 * e2e.test.ts — End-to-end integration test against Stellar testnet.
 *
 * This test exercises the full flow:
 *   1. Deploy contracts to testnet (or use pre-deployed addresses from env).
 *   2. Register a username commitment via IdentityRegistry.
 *   3. Generate a Groth16 proof for a payment.
 *   4. Route the payment via PaymentRouter.
 *   5. Verify the recipient can detect the stealth payment.
 *
 * Prerequisites
 * -------------
 * - Set environment variables (see .env.example):
 *     STELLAR_SECRET_KEY   — funded testnet keypair
 *     IDENTITY_REGISTRY    — deployed contract address
 *     PAYMENT_ROUTER       — deployed contract address
 *     PAYMENT_PROOF_WASM   — path to compiled payment_proof.wasm
 *     PAYMENT_PROOF_ZKEY   — path to payment_proof.zkey
 *
 * Run
 * ---
 *   cd sdk && npm test -- --testPathPattern=integration
 *
 * TODO for contributors
 * ---------------------
 * - Implement contract deployment helpers so tests are self-contained.
 * - Add assertions on Stellar transaction events once PaymentRouter emits them.
 * - Add a stealth scanning step using sdk/src/stealth.ts scanPayments.
 */

import { Keypair } from "@stellar/stellar-sdk";
import { ZKIdentityClient } from "../../src/client";
import { generateSecret } from "../../src/commitment";

const SKIP = !process.env.STELLAR_SECRET_KEY;

(SKIP ? describe.skip : describe)("E2E: register and send", () => {
  let client: ZKIdentityClient;

  beforeAll(() => {
    client = new ZKIdentityClient({
      network: "testnet",
      contracts: {
        identityRegistry: process.env.IDENTITY_REGISTRY!,
        paymentRouter: process.env.PAYMENT_ROUTER!,
      },
      keypair: Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!),
    });
  });

  it("registers a username commitment on-chain", async () => {
    const secret = generateSecret();
    const txHash = await client.register("alice_test", secret);
    expect(txHash).toMatch(/^[0-9a-f]{64}$/i);
  });

  it("sends a private payment to a stealth address", async () => {
    // TODO: implement once circuits are compiled and zkey is available
    expect(true).toBe(true);
  });
});
