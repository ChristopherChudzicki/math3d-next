import type { Express } from "express";
import login from "./login";

export const attachRoutes = (express: Express): void => {
  express.post("/user/login", async (req, res) => {
    const { email }: { email: string } = req.body;
    const result = await login(email);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result }));
  });

  express.post("/user/authenticate", (req, res) => {
    const { body } = req;
    console.log(body);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result: false }));
  });
};
