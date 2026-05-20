pragma circom 2.1.6;

/*
 * StealthAddress
 * --------------
 * Derives a one-time stealth address from a recipient's public key and a
 * sender's ephemeral secret, following the ERC-5564 stealth address scheme
 * adapted for BN254 (the curve used by Stellar Protocol 25).
 *
 * Scheme (simplified)
 * -------------------
 * Given:
 *   recipient_pubkey  — recipient's public key (BN254 G1 point, x-coordinate)
 *   sender_secret     — sender's ephemeral scalar (random per payment)
 *
 * Compute:
 *   shared_secret     = Poseidon(recipient_pubkey * sender_secret)  [ECDH]
 *   stealth_address   = Poseidon(shared_secret, 0)                  [derive address]
 *
 * Public inputs:  stealth_address, recipient_pubkey
 * Private inputs: sender_secret, shared_secret
 *
 * The recipient scans the chain, recomputes shared_secret using their private
 * key, and checks whether stealth_address matches.
 *
 * TODO for contributors
 * ---------------------
 * - Replace the Poseidon-based ECDH stub with a proper BabyJubJub or BN254
 *   scalar multiplication using circomlib's EscalarMulAny component.
 * - Add a view tag (first byte of shared_secret) as a public output so
 *   recipients can scan efficiently without checking every transaction.
 * - Ensure the circuit is compatible with the Groth16Verifier's expected
 *   public input ordering.
 */

include "node_modules/circomlib/circuits/poseidon.circom";

template StealthAddress() {
    // Public inputs
    signal input stealth_address;
    signal input recipient_pubkey;

    // Private inputs
    signal input sender_secret;
    signal input shared_secret; // = ECDH(recipient_pubkey, sender_secret)

    // TODO: replace with real scalar multiplication
    // For now, constrain shared_secret = Poseidon(recipient_pubkey, sender_secret)
    component ecdh_stub = Poseidon(2);
    ecdh_stub.inputs[0] <== recipient_pubkey;
    ecdh_stub.inputs[1] <== sender_secret;
    shared_secret === ecdh_stub.out;

    // Derive stealth address from shared secret
    component addr_hasher = Poseidon(2);
    addr_hasher.inputs[0] <== shared_secret;
    addr_hasher.inputs[1] <== 0;
    stealth_address === addr_hasher.out;
}

component main {
    public [stealth_address, recipient_pubkey]
} = StealthAddress();
