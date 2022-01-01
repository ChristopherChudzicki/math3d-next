import type { Express } from "express";
import login from "./login";
import sendSignupEmail from "./sendSignupEmail";

export const attachRoutes = (express: Express): void => {
  express.get("/user/signup", async (req, _res) => {
    const { email }: { email: string } = req.body;
    await sendSignupEmail(email);
    throw new Error("Not Implemented");
  });

  express.post("/user", async (_req, _res) => {
    throw new Error("Not Implemented");
  });

  express.post("/user/login", async (req, res) => {
    const { email }: { email: string } = req.body;
    const result = await login(email);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result }));
  });

  express.post("/user", (req, res) => {
    const { body } = req;
    console.log(body);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result: false }));
  });
};
