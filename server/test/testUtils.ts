import type { Request, Response, NextFunction } from "express";

const mockRequest = (body: unknown): Request => ({ body } as Request);
const mockResponse = () => {
  const response = {
    status: jest.fn(() => response),
    json: jest.fn(() => response),
  } as unknown as Response;
  return response;
};

export const mockReqResNext = (
  body?: unknown
): { request: Request; response: Response; next: NextFunction } => {
  const request = mockRequest(body);
  const response = mockResponse();
  const next = jest.fn();
  return { request, response, next };
};

export const getThrownError = async (fn: () => unknown): Promise<any> => {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("Fn should have thrown");
};
