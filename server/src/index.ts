import express from "express";
import * as user from "./controllers/user";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World!!");
});

user.attachRoutes(app);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
