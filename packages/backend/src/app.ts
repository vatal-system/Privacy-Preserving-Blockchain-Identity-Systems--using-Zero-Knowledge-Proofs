import express from "express";
import cors from "cors";
import { commitmentRouter } from "./routes/commitment";
import { registerRouter } from "./routes/register";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/commitment", commitmentRouter);
app.use("/register", registerRouter);
