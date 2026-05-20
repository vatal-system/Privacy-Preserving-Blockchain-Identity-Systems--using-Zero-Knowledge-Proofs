export { ZKIdentityClient } from "./client";
export type { ClientConfig, Network } from "./client";
export { buildCommitment, encodeUsername, generateSecret, fieldElementToBytes } from "./commitment";
export { generatePaymentProof, verifyProofLocally } from "./proof";
export type { PaymentProofInputs, Groth16Proof } from "./proof";
export { generateStealthKeyPair, deriveStealthAddress, scanPayments } from "./stealth";
export type { StealthKeyPair, StealthPayment } from "./stealth";
