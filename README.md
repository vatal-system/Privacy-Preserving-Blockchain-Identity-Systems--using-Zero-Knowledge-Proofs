# Privacy-Preserving Blockchain Identity System using Zero-Knowledge Proofs

A privacy layer for the Stellar network that lets users register human-readable usernames and send payments without exposing wallet addresses on-chain. Built with Groth16 zk-SNARKs, Pedersen commitments, and stealth addresses on Soroban smart contracts.

## How it works

1. **Register** — A user commits `H(username, secret)` to the on-chain `IdentityRegistry` contract. The wallet address is never stored.
2. **Send** — The sender generates a Groth16 proof (client-side) that they know the preimage of the recipient's commitment, then routes the payment through `PaymentRouter` to a fresh stealth address.
3. **Verify** — The `Groth16Verifier` contract checks the proof on-chain using Stellar's native BN254 primitives (Protocol 25 / X-Ray upgrade). If valid, funds are released to the stealth address.
4. **Receive** — The recipient scans the chain with their private key to detect and claim incoming stealth payments.

No wallet address ever appears in the transaction graph. The link between username and wallet is known only to the owner.

## Prior art

| Project | Chain | Status | What we borrow |
|---|---|---|---|
| [Curvy Protocol](https://curvy.box) | Ethereum, Solana, Starknet | Production (2026) | Stealth address + Groth16 pattern |
| [NickPay](https://arxiv.org/abs/2503.19872) | Ethereum | Research prototype | Nickname/commitment registry design |
| [EIP-7812](https://eips.ethereum.org/EIPS/eip-7812) | Ethereum | Draft | On-chain ZK commitment registry |
| Starknet Privacy | Starknet | Production | Note model, selective disclosure |

This project is the **first native implementation** of this pattern on Stellar/Soroban, taking advantage of the Groth16 verifier and BN254 support added in Protocol 25.

## Repository structure

```
contracts/          Soroban smart contracts (Rust + Wasm)
  identity_registry/  Username commitment registry
  payment_router/     Stealth payment routing
  groth16_verifier/   On-chain proof verification

circuits/           Circom ZK circuits
  username_commitment.circom   Proves knowledge of username preimage
  payment_proof.circom         Proves valid payment authorization
  stealth_address.circom       Derives stealth address from recipient key

sdk/                TypeScript client SDK
  src/
    commitment.ts   Pedersen commitment helpers
    proof.ts        Client-side Groth16 proof generation (snarkjs)
    stealth.ts      Stealth address generation and scanning
    client.ts       Soroban contract interaction

tests/
  unit/             Per-module unit tests
  integration/      Full end-to-end flow tests against testnet

docs/
  architecture.md   System design and cryptographic choices
  circuits.md       Circuit design and trusted setup guide
  CONTRIBUTING.md   How to contribute
```

## Quickstart

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
- [Node.js](https://nodejs.org/) ≥ 20
- [Circom](https://docs.circom.io/getting-started/installation/) + [snarkjs](https://github.com/iden3/snarkjs)

### Build contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### Run contract tests

```bash
cd contracts
cargo test
```

### Build circuits

```bash
cd circuits
circom username_commitment.circom --r1cs --wasm --sym
snarkjs groth16 setup username_commitment.r1cs pot12_final.ptau username_commitment_0000.zkey
```

### Build SDK

```bash
cd sdk
npm install
npm run build
npm test
```

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide, including how to pick up issues, the PR process, and coding standards.

## License

MIT
