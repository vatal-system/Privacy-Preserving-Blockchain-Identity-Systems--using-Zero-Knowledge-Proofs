"use client";

import { useState } from "react";

export default function SendPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      // Check recipient is registered
      const checkRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/commitment/${encodeURIComponent(recipient)}`
      );
      if (!checkRes.ok) {
        const err = await checkRes.json();
        throw new Error(err.error ?? "Lookup failed");
      }
      const { registered } = await checkRes.json();
      if (!registered) {
        throw new Error(`Username "${recipient}" is not registered.`);
      }

      // TODO: generate ZK proof and submit via PaymentRouter
      // For now surface a clear "not yet implemented" message
      throw new Error("On-chain payment submission requires compiled ZK circuits (see circuits/).");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <>
      <h2>Send Private Payment</h2>
      <p style={{ color: "#555" }}>
        Funds are routed to a stealth address. The recipient's wallet is never
        revealed on-chain.
      </p>
      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Recipient username
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="alice"
            minLength={3}
            maxLength={31}
            required
            style={{ display: "block", marginTop: 4, padding: "6px 8px", width: "100%" }}
          />
        </label>
        <label>
          Amount (XLM)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            min="0.0000001"
            step="any"
            required
            style={{ display: "block", marginTop: 4, padding: "6px 8px", width: "100%" }}
          />
        </label>
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send"}
        </button>
      </form>
      {status === "ok" && <p style={{ color: "green", marginTop: 12 }}>{message}</p>}
      {status === "error" && <p style={{ color: "red", marginTop: 12 }}>{message}</p>}
    </>
  );
}
