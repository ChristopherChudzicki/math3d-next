import type { Request, Response, NextFunction } from "express";

const mockRequest = (body: unknown, headers: unknown): Request =>
  ({ body, headers } as Request);

const mockResponse = () => {
  const response = {
    status: jest.fn(() => response),
    json: jest.fn(() => response),
  } as unknown as jest.Mocked<Response>;
  return response;
};

export const mockReqResNext = ({
  body,
  headers = {},
}: {
  body?: unknown;
  headers?: unknown;
} = {}): {
  request: Request;
  response: jest.Mocked<Response>;
  next: NextFunction;
} => {
  const request = mockRequest(body, headers);
  const response = mockResponse();
  const next = jest.fn();
  return { request, response, next };
};

export const getThrownError = (fn: () => unknown): Error => {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error(`Fn should have thrown an Error, not a ${typeof error}`);
  }
  throw new Error("Fn should have thrown");
};

export const getRejection = async (fn: () => unknown): Promise<Error> => {
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error(`Fn should have thrown an Error, not a ${typeof error}`);
  }
  throw new Error("Fn should have thrown");
};
