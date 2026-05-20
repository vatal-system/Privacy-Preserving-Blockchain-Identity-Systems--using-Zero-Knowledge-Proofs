import { generateStealthKeyPair, deriveStealthAddress } from "../../src/stealth";

describe("generateStealthKeyPair", () => {
  it("returns 32-byte private and public keys", () => {
    const kp = generateStealthKeyPair();
    expect(kp.privateKey).toHaveLength(32);
    expect(kp.publicKey).toHaveLength(32);
  });

  it("generates unique keypairs", () => {
    const kp1 = generateStealthKeyPair();
    const kp2 = generateStealthKeyPair();
    expect(Buffer.from(kp1.privateKey).toString("hex")).not.toBe(
      Buffer.from(kp2.privateKey).toString("hex")
    );
  });
});

describe("deriveStealthAddress", () => {
  it("returns 32-byte stealth address and hash", async () => {
    const { publicKey } = generateStealthKeyPair();
    const { stealthAddress, stealthAddressHash, ephemeralPubKey } =
      await deriveStealthAddress(publicKey);

    expect(stealthAddress).toHaveLength(32);
    expect(stealthAddressHash).toHaveLength(32);
    expect(ephemeralPubKey).toHaveLength(32);
  });

  it("produces different stealth addresses for different recipients", async () => {
    const kp1 = generateStealthKeyPair();
    const kp2 = generateStealthKeyPair();

    const { stealthAddress: a1 } = await deriveStealthAddress(kp1.publicKey);
    const { stealthAddress: a2 } = await deriveStealthAddress(kp2.publicKey);

    expect(Buffer.from(a1).toString("hex")).not.toBe(
      Buffer.from(a2).toString("hex")
    );
  });
});
