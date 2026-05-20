pragma circom 2.1.6;

/*
 * UsernameCommitment
 * ------------------
 * Proves knowledge of (username, secret) such that:
 *
 *   commitment = Poseidon(username, secret)
 *
 * Public inputs:  commitment
 * Private inputs: username, secret
 *
 * The on-chain IdentityRegistry stores only `commitment`.
 * This circuit lets a user prove they own a registered username
 * without revealing the username or the secret.
 *
 * Poseidon is used because Stellar Protocol 25 added a native
 * Poseidon host function, making on-chain verification cheap.
 *
 * TODO for contributors
 * ---------------------
 * - Validate that `username` encodes a valid UTF-8 string of
 *   length 3–32 characters (add a length range check).
 * - Add a domain-separation tag so commitments from this circuit
 *   cannot be confused with commitments from other circuits.
 */

include "node_modules/circomlib/circuits/poseidon.circom";

template UsernameCommitment() {
    // Public
    signal input commitment;

    // Private
    signal input username;
    signal input secret;

    // Compute Poseidon(username, secret)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== username;
    hasher.inputs[1] <== secret;

    // Constrain: computed hash must equal the public commitment
    commitment === hasher.out;
}

component main { public [commitment] } = UsernameCommitment();
