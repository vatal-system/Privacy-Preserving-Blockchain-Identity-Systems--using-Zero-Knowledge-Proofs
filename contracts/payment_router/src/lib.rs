//! PaymentRouter — routes XLM/token payments to stealth addresses.
//!
//! Flow
//! ----
//! 1. Sender calls `send` with:
//!    - `recipient_commitment` — the on-chain commitment of the recipient's username.
//!    - `stealth_address`      — a fresh one-time address derived by the sender from
//!                               the recipient's public key (ECDH + hash).
//!    - `proof`                — Groth16 proof that the sender knows the preimage of
//!                               `recipient_commitment` (i.e. the username).
//!    - `public_inputs`        — public witness: [commitment, stealth_address_hash, amount].
//!    - `amount`               — XLM stroops to transfer.
//!
//! 2. Router verifies the proof via cross-contract call to `Groth16Verifier`.
//! 3. Router checks the commitment exists in `IdentityRegistry`.
//! 4. Router transfers `amount` to `stealth_address`.
//!
//! The recipient scans the chain for stealth addresses they can unlock with
//! their private key (see sdk/src/stealth.ts).

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, Vec,
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

pub type Commitment = BytesN<32>;
pub type Proof = Bytes;
pub type FieldElement = BytesN<32>;

#[contracttype]
pub enum DataKey {
    /// Address of the deployed IdentityRegistry contract.
    RegistryAddress,
    /// Address of the deployed Groth16Verifier contract.
    VerifierAddress,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct PaymentRouter;

#[contractimpl]
impl PaymentRouter {
    /// One-time initialisation. Must be called by the deployer.
    pub fn init(env: Env, registry: Address, verifier: Address) {
        env.storage().instance().set(&DataKey::RegistryAddress, &registry);
        env.storage().instance().set(&DataKey::VerifierAddress, &verifier);
    }

    /// Send a private payment to a stealth address.
    ///
    /// # Arguments
    /// * `token`                — SAC address of the asset to transfer (use XLM SAC for lumens).
    /// * `recipient_commitment` — On-chain commitment of the recipient's username.
    /// * `stealth_address`      — Fresh one-time address for this payment.
    /// * `proof`                — Groth16 proof bytes.
    /// * `public_inputs`        — Public witness for the proof.
    /// * `amount`               — Amount in the token's base unit (stroops for XLM).
    ///
    /// # TODO for contributors
    /// - Implement cross-contract call to `IdentityRegistry::is_registered`.
    /// - Implement cross-contract call to `Groth16Verifier::verify`.
    /// - Add a nullifier parameter to prevent proof replay.
    /// - Emit a `PaymentSent` event with (stealth_address, amount) so the SDK
    ///   can scan for incoming payments without revealing the recipient.
    pub fn send(
        env: Env,
        token: Address,
        recipient_commitment: Commitment,
        stealth_address: Address,
        proof: Proof,
        public_inputs: Vec<FieldElement>,
        amount: i128,
    ) {
        // TODO: verify commitment is registered
        // let registry: Address = env.storage().instance().get(&DataKey::RegistryAddress).unwrap();
        // let registry_client = identity_registry::Client::new(&env, &registry);
        // assert!(registry_client.is_registered(&recipient_commitment), "unknown commitment");

        // TODO: verify ZK proof
        // let verifier: Address = env.storage().instance().get(&DataKey::VerifierAddress).unwrap();
        // let verifier_client = groth16_verifier::Client::new(&env, &verifier);
        // assert!(verifier_client.verify(&proof, &public_inputs), "invalid proof");

        // Transfer funds to the stealth address
        let sender = env.current_contract_address();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &stealth_address, &amount);

        let _ = (recipient_commitment, proof, public_inputs);
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    // Integration tests live in tests/integration/.
    // Unit tests for individual helpers go here once helpers are extracted.
}
