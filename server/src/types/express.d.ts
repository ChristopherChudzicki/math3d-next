import type { Context } from "../middleware/attachContext";

// https://stackoverflow.com/a/55718334/2747370
export declare module "express-serve-static-core" {
  interface Request {
    context: Context;
  }
}
