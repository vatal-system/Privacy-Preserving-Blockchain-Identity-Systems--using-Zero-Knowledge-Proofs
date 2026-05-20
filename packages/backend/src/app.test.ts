import request from "supertest";
import { app } from "./app";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /commitment/:username", () => {
  it("returns registered:false for a valid username", async () => {
    const res = await request(app).get("/commitment/alice");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ username: "alice", registered: false });
  });

  it("rejects username shorter than 3 chars", async () => {
    const res = await request(app).get("/commitment/ab");
    expect(res.status).toBe(400);
  });
});

describe("POST /register", () => {
  const valid = {
    commitment: "a".repeat(64),
    nullifier: "b".repeat(64),
  };

  it("accepts valid hex-32 inputs", async () => {
    const res = await request(app).post("/register").send(valid);
    expect(res.status).toBe(202);
    expect(res.body.status).toBe("pending");
  });

  it("rejects missing commitment", async () => {
    const res = await request(app).post("/register").send({ nullifier: valid.nullifier });
    expect(res.status).toBe(400);
  });

  it("rejects short commitment", async () => {
    const res = await request(app).post("/register").send({ commitment: "abc", nullifier: valid.nullifier });
    expect(res.status).toBe(400);
  });
});
