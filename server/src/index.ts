import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  console.log("woof");
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ result: "hi" }));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
