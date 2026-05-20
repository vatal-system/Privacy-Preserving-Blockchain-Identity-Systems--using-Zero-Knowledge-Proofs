# Circuit Design & Trusted Setup

## Circuits

### `username_commitment.circom`

Proves knowledge of `(username, secret)` such that `Poseidon(username, secret) == commitment`.

| Signal | Type | Description |
|---|---|---|
| `commitment` | public input | On-chain commitment |
| `username` | private input | Encoded username (≤ 31 bytes as field element) |
| `secret` | private input | 32-byte random secret |

Constraints: 1 Poseidon(2) invocation ≈ 240 R1CS constraints.

### `payment_proof.circom`

Proves that a sender knows the recipient's username and has derived the correct
stealth address for this payment.

| Signal | Type | Description |
|---|---|---|
| `recipient_commitment` | public | Registered commitment of recipient |
| `stealth_address_hash` | public | Hash of the one-time stealth address |
| `amount` | public | Payment amount (stroops) |
| `recipient_username` | private | Recipient's username |
| `recipient_secret` | private | Recipient's registration secret |
| `sender_secret` | private | Sender's ephemeral scalar |

### `stealth_address.circom`

Proves that a stealth address was correctly derived from a recipient's public key
and a sender's ephemeral secret.

| Signal | Type | Description |
|---|---|---|
| `stealth_address` | public | Derived one-time address |
| `recipient_pubkey` | public | Recipient's public key (x-coordinate) |
| `sender_secret` | private | Sender's ephemeral scalar |
| `shared_secret` | private | ECDH shared secret |

## Compiling circuits

```bash
cd circuits

# Install circomlib
npm install circomlib

# Compile each circuit
circom username_commitment.circom --r1cs --wasm --sym -o build/
circom payment_proof.circom       --r1cs --wasm --sym -o build/
circom stealth_address.circom     --r1cs --wasm --sym -o build/
```

## Trusted setup (Groth16)

Groth16 requires a two-phase trusted setup:

### Phase 1 — Powers of Tau (universal, reusable)

```bash
# Download an existing ceremony (pot12 supports up to 2^12 = 4096 constraints)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau \
     -O pot12_final.ptau
```

For production, run or participate in a larger ceremony (pot16 or pot17).

### Phase 2 — Circuit-specific setup

```bash
# username_commitment
snarkjs groth16 setup build/username_commitment.r1cs pot12_final.ptau \
        build/username_commitment_0000.zkey
snarkjs zkey contribute build/username_commitment_0000.zkey \
        build/username_commitment_0001.zkey --name="contributor1" -e="random entropy"
snarkjs zkey export verificationkey build/username_commitment_0001.zkey \
        build/username_commitment_vkey.json

# payment_proof
snarkjs groth16 setup build/payment_proof.r1cs pot12_final.ptau \
        build/payment_proof_0000.zkey
snarkjs zkey contribute build/payment_proof_0000.zkey \
        build/payment_proof_0001.zkey --name="contributor1" -e="random entropy"
snarkjs zkey export verificationkey build/payment_proof_0001.zkey \
        build/payment_proof_vkey.json
```

### Deploy verifying key to Groth16Verifier contract

```bash
# Export the VK as bytes and call set_verifying_key on the deployed contract
stellar contract invoke \
  --id <GROTH16_VERIFIER_ADDRESS> \
  --source <DEPLOYER_SECRET> \
  --network testnet \
  -- set_verifying_key \
  --vk "$(cat build/payment_proof_vkey.json | xxd -p | tr -d '\n')"
```

## Security notes

- The `_0000.zkey` files from phase 2 setup must be discarded after the ceremony.
  Anyone who retains the toxic waste can forge proofs.
- For mainnet, run a multi-party computation (MPC) ceremony with at least 10
  independent contributors. The setup is secure as long as one contributor is honest.
- Circuit audits should be completed before mainnet deployment.
