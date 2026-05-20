//! Groth16Verifier — on-chain zk-SNARK proof verification over BN254.
//!
//! Stellar Protocol 25 (X-Ray) added native BN254 pairing and Poseidon hash
//! host functions, making Groth16 verification practical on Soroban.
//!
//! This contract wraps those primitives and exposes a single `verify` entry
//! point that other contracts (e.g. PaymentRouter) call cross-contract.
//!
//! Proof format (Groth16 over BN254, Circom convention)
//! ----------------------------------------------------
//! pi_a  : G1 point  (64 bytes)
//! pi_b  : G2 point  (128 bytes)
//! pi_c  : G1 point  (64 bytes)
//! public_inputs : Vec<Fr> (32 bytes each)
//!
//! Verification key is stored in contract storage and set once by the deployer.

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Bytes, BytesN, Env, Vec};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Serialised Groth16 proof (pi_a || pi_b || pi_c = 256 bytes).
pub type Proof = Bytes;

/// A single BN254 field element (32 bytes).
pub type FieldElement = BytesN<32>;

#[contracttype]
pub enum DataKey {
    /// Serialised verification key (set once at deploy time).
    VerifyingKey,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct Groth16Verifier;

#[contractimpl]
impl Groth16Verifier {
    /// Store the verifying key. Must be called once by the deployer.
    ///
    /// # TODO for contributors
    /// - Add admin / owner check so only the deployer can call this.
    /// - Accept the VK in the standard snarkjs JSON format and deserialise it.
    pub fn set_verifying_key(env: Env, vk: Bytes) {
        env.storage().instance().set(&DataKey::VerifyingKey, &vk);
    }

    /// Verify a Groth16 proof against the stored verifying key.
    ///
    /// Returns `true` if the proof is valid, `false` otherwise.
    ///
    /// # Arguments
    /// * `proof`         — Serialised pi_a, pi_b, pi_c (256 bytes).
    /// * `public_inputs` — Public witness values (field elements).
    ///
    /// # TODO for contributors
    /// - Implement the actual pairing check using Soroban's BN254 host functions.
    ///   The host exposes `bn254_g1_add`, `bn254_g1_mul`, `bn254_pairing` etc.
    ///   Reference: https://developers.stellar.org/docs/build/zk-proofs-on-stellar
    /// - Deserialise `proof` into (pi_a, pi_b, pi_c) G1/G2 points.
    /// - Compute the linear combination of public inputs with the VK's IC points.
    /// - Run the four-pairing Groth16 check and return the result.
    pub fn verify(env: Env, proof: Proof, public_inputs: Vec<FieldElement>) -> bool {
        let _vk: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::VerifyingKey)
            .expect("verifying key not set");

        // PLACEHOLDER — replace with real BN254 pairing check.
        // Returning false here ensures no proof passes until implemented.
        let _ = (proof, public_inputs);
        false
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{Bytes, Env, Vec};

    #[test]
    fn verify_returns_false_before_implementation() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Groth16Verifier);
        let client = Groth16VerifierClient::new(&env, &contract_id);

        let dummy_vk = Bytes::from_slice(&env, &[0u8; 32]);
        client.set_verifying_key(&dummy_vk);

        let dummy_proof = Bytes::from_slice(&env, &[0u8; 256]);
        let inputs: Vec<BytesN<32>> = Vec::new(&env);

        // Until the pairing check is implemented this must return false.
        assert!(!client.verify(&dummy_proof, &inputs));
    }
}
