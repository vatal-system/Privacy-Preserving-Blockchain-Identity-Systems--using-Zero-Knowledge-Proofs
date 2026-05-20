import { buildCommitment, encodeUsername, generateSecret } from "../../src/commitment";

describe("encodeUsername", () => {
  it("encodes a short username to a 32-byte field element", () => {
    const fe = encodeUsername("alice");
    expect(fe).toBeGreaterThan(0n);
  });

  it("rejects usernames longer than 31 bytes", () => {
    expect(() => encodeUsername("a".repeat(32))).toThrow("username too long");
  });

  it("produces different values for different usernames", () => {
    expect(encodeUsername("alice")).not.toBe(encodeUsername("bob"));
  });
});

describe("buildCommitment", () => {
  it("returns 32-byte commitment and nullifier", async () => {
    const secret = generateSecret();
    const { commitment, nullifier } = await buildCommitment("alice", secret);
    expect(commitment).toHaveLength(32);
    expect(nullifier).toHaveLength(32);
  });

  it("same inputs produce same commitment", async () => {
    const secret = generateSecret();
    const { commitment: c1 } = await buildCommitment("alice", secret);
    const { commitment: c2 } = await buildCommitment("alice", secret);
    expect(Buffer.from(c1).toString("hex")).toBe(Buffer.from(c2).toString("hex"));
  });

  it("different usernames produce different commitments", async () => {
    const secret = generateSecret();
    const { commitment: c1 } = await buildCommitment("alice", secret);
    const { commitment: c2 } = await buildCommitment("bob", secret);
    expect(Buffer.from(c1).toString("hex")).not.toBe(Buffer.from(c2).toString("hex"));
  });

  it("different secrets produce different commitments", async () => {
    const { commitment: c1 } = await buildCommitment("alice", generateSecret());
    const { commitment: c2 } = await buildCommitment("alice", generateSecret());
    expect(Buffer.from(c1).toString("hex")).not.toBe(Buffer.from(c2).toString("hex"));
  });
});
