import express from "express";
import { attachRoutes } from "./util/routing";
import * as user from "./controllers/user";
import * as middleware from "./middleware";
import getEnvVar from "./util/getEnvVar";

const app = express();
const port = Number(getEnvVar("SERVER_PORT"));

app.use(express.json());

app.use(middleware.attachContext);

app.get("/", async (req, res) => {
  console.log(`hasValidAccessToken: ${req.context.hasValidAccessToken}`);
  console.log(`userId: ${req.context.userId}`);
  res.send("Hello World!!");
});

attachRoutes(app, user.routes);

app.use(middleware.sendErrorResponse);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
