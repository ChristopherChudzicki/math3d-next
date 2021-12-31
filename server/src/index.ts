import express from "express";
import { User } from "./database/models";
import sequelize from "./database/database";

const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  res.send("Hello World!!");
});

app.get("/test", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ result: "hi" }));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
