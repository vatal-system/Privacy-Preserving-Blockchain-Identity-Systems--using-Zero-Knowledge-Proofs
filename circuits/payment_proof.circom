pragma circom 2.1.6;

/*
 * PaymentProof
 * ------------
 * Proves that a sender is authorised to route a payment to a stealth address
 * for a recipient identified by their on-chain commitment.
 *
 * Public inputs:
 *   recipient_commitment  — registered commitment of the recipient's username
 *   stealth_address_hash  — hash of the stealth address for this payment
 *   amount                — payment amount (in stroops)
 *
 * Private inputs:
 *   recipient_username    — plaintext username of the recipient
 *   recipient_secret      — secret used when the recipient registered
 *   sender_secret         — sender's ephemeral secret for stealth derivation
 *
 * Constraints
 * -----------
 * 1. Poseidon(recipient_username, recipient_secret) == recipient_commitment
 * 2. Poseidon(recipient_username, sender_secret)    == stealth_address_hash
 *    (simplified; real derivation uses ECDH — see stealth_address.circom)
 * 3. amount > 0  (range check)
 *
 * TODO for contributors
 * ---------------------
 * - Replace constraint 2 with the full ECDH-based stealth derivation from
 *   stealth_address.circom using a component include.
 * - Add a nullifier output: nullifier = Poseidon(sender_secret, nonce)
 *   so the contract can reject replayed proofs.
 * - Add an amount range check using a Num2Bits / LessThan component.
 */

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template PaymentProof() {
    // Public inputs
    signal input recipient_commitment;
    signal input stealth_address_hash;
    signal input amount;

    // Private inputs
    signal input recipient_username;
    signal input recipient_secret;
    signal input sender_secret;

    // Constraint 1: verify recipient commitment
    component commitment_hasher = Poseidon(2);
    commitment_hasher.inputs[0] <== recipient_username;
    commitment_hasher.inputs[1] <== recipient_secret;
    recipient_commitment === commitment_hasher.out;

    // Constraint 2: verify stealth address derivation (simplified)
    component stealth_hasher = Poseidon(2);
    stealth_hasher.inputs[0] <== recipient_username;
    stealth_hasher.inputs[1] <== sender_secret;
    stealth_address_hash === stealth_hasher.out;

    // Constraint 3: amount must be positive
    // TODO: replace with proper range check
    signal amount_nonzero;
    amount_nonzero <== amount;
    _ <== amount_nonzero; // placeholder to avoid unused signal warning
}

component main {
    public [recipient_commitment, stealth_address_hash, amount]
} = PaymentProof();
