# Contributing

Thank you for your interest in contributing. This document explains how to get
started, what areas need work, and how to submit changes.

## Getting started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Rust | stable | https://rustup.rs |
| wasm32 target | — | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | latest | https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli |
| Node.js | ≥ 20 | https://nodejs.org |
| Circom | 2.x | https://docs.circom.io/getting-started/installation |
| snarkjs | 0.7.x | `npm install -g snarkjs` |

### Clone and build

```bash
git clone <repo-url>
cd Privacy-Preserving-Blockchain-Identity-Systems--using-Zero-Knowledge-Proofs

# Contracts
cd contracts && cargo build --target wasm32-unknown-unknown --release && cd ..

# SDK
cd sdk && npm install && npm run build && cd ..

# Tests
cd contracts && cargo test && cd ..
cd sdk && npm test && cd ..
```

## Project areas and open work

The codebase is intentionally scaffolded with `TODO` comments marking where
implementation is needed. Each TODO is a potential contribution.

### Contracts (`contracts/`)

| Contract | Status | Key TODOs |
|---|---|---|
| `identity_registry` | Skeleton complete | Add ZK proof verification on register; emit events |
| `groth16_verifier` | Skeleton complete | **Implement BN254 pairing check** (core cryptography task) |
| `payment_router` | Skeleton complete | Wire cross-contract calls; add payment nullifiers; emit events |

The most impactful open task is implementing the Groth16 pairing check in
`groth16_verifier/src/lib.rs` using Stellar's native BN254 host functions.
Reference: [Boundless on Stellar](https://boundless.network/blog/verifying-proofs-on-stellar/).

### Circuits (`circuits/`)

| Circuit | Status | Key TODOs |
|---|---|---|
| `username_commitment` | Complete | Add username length range check |
| `payment_proof` | Skeleton | Replace stealth derivation stub with real ECDH component |
| `stealth_address` | Skeleton | Replace Poseidon ECDH stub with BabyJubJub scalar multiplication |

### SDK (`sdk/src/`)

| Module | Status | Key TODOs |
|---|---|---|
| `commitment.ts` | Complete | — |
| `stealth.ts` | Skeleton | Implement real ECDH; implement `scanPayments` |
| `proof.ts` | Skeleton | Align proof serialisation with contract's deserialisation |
| `client.ts` | Skeleton | Encode stealth address as Stellar account ID; fetch recipient pubkey from registry |

### Tests (`tests/`)

- Unit tests for `commitment.ts` and `stealth.ts` are in place.
- Integration tests in `tests/integration/e2e.test.ts` need contract deployment
  helpers and full flow assertions.

### Docs (`docs/`)

- `architecture.md` — complete.
- `circuits.md` — complete.
- Audit report — needed before mainnet.

## Coding standards

**Rust**
- Run `cargo fmt` and `cargo clippy -- -D warnings` before committing.
- Every public function must have a doc comment.
- New contract entry points need at least one unit test.

**TypeScript**
- Run `npm run lint` before committing.
- Prefer `async/await` over raw Promises.
- Export types alongside functions.

**Circom**
- Comment every signal and constraint.
- Include a `TODO` comment for any stub constraint.

## Pull request process

1. Open an issue describing the change before starting large work.
2. Branch from `main`: `git checkout -b feat/your-feature`.
3. Keep PRs focused — one logical change per PR.
4. Ensure all tests pass locally before opening a PR.
5. Fill in the PR template: what changed, how it was tested, any open questions.

## Security

If you find a security vulnerability, please **do not** open a public issue.
Email the maintainers directly. We follow responsible disclosure.
