import { Request, Response } from "express";
import signup from "../../../src/controllers/user/signup";
// Mocks
import { sendEmail } from "../../../src/util/email";

jest.mock("../../../src/util/email");

/**
 * TO TEST:
 * - request body
 * - all valid request bodies should return 200
 * - if user does not exist, send email
 * - if user does exist, send email (possibly different)
 */

const mockRequest = (body: unknown): Request => ({ body } as Request);
const mockResponse = () => {
  const response = {
    status: jest.fn(() => response),
  } as unknown as Response;
  return response;
};
const mockReqRes = (
  body: unknown
): { request: Request; response: Response } => {
  const request = mockRequest(body);
  const response = mockResponse();
  return { request, response };
};

describe("signup", () => {
  it("Responds 400 if email is missing from body", async () => {
    const { request, response } = mockReqRes({});
    signup(request, response);

    expect(response.status).toHaveBeenLastCalledWith(400);
  });

  it("Calls sendEmail", async () => {
    const { request, response } = mockReqRes({ email: "leo@dog.com" });

    await signup(request, response);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith("leo@dog.com");
  });
});
