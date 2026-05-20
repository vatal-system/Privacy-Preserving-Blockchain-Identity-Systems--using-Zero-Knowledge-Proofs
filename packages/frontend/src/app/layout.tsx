import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZK Identity — Stellar",
  description: "Privacy-preserving identity and payments on Stellar using ZK proofs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>🔐 ZK Identity</h1>
          <nav style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <a href="/">Register</a>
            <a href="/send">Send Payment</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
