"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (username.length < 3 || username.length > 31) {
      setStatus("error");
      setMessage("Username must be 3–31 characters.");
      return;
    }

    setStatus("loading");
    try {
      // Generate a random 32-byte secret (hex) client-side
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Derive a stub commitment (sha-256 of username+secret via SubtleCrypto)
      const enc = new TextEncoder();
      const data = enc.encode(username + secret);
      const hashBuf = await crypto.subtle.digest("SHA-256", data);
      const commitment = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Derive nullifier = sha-256 of secret
      const nullBuf = await crypto.subtle.digest("SHA-256", enc.encode(secret));
      const nullifier = Array.from(new Uint8Array(nullBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commitment, nullifier }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Registration failed");
      }

      const { txHash } = await res.json();
      setStatus("ok");
      setMessage(`Registered! tx: ${txHash}`);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <>
      <h2>Register Username</h2>
      <p style={{ color: "#555" }}>
        Your wallet address is never stored. Only a zero-knowledge commitment is
        written on-chain.
      </p>
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            minLength={3}
            maxLength={31}
            required
            style={{ display: "block", marginTop: 4, padding: "6px 8px", width: "100%" }}
          />
        </label>
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Registering…" : "Register"}
        </button>
      </form>
      {status === "ok" && <p style={{ color: "green", marginTop: 12 }}>{message}</p>}
      {status === "error" && <p style={{ color: "red", marginTop: 12 }}>{message}</p>}
    </>
  );
}
