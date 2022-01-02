import type { Request, Response } from "express";

const validateRequest = (_req: Request) => {
  // use ajv for this
  console.log("TODO");
};

const signup = (req: Request, _res: Response): void => {
  validateRequest(req);
  const { email }: { email: string } = req.body;
  console.log(email);
  throw new Error("Not Implemented");
};

export default signup;
