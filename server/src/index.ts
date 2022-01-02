import express from "express";
import { attachRoutes } from "./util/routing";
import * as user from "./controllers/user";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World!!");
});

attachRoutes(app, user.routes);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
