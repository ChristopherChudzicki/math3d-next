import { mockReqResNext, getThrownError } from "../../testUtils";
import signup from "../../../src/controllers/user/signup";
import { ClientError } from "../../../src/util/errors";
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

describe("signup", () => {
  it("throws ClientError if email is missing from body", async () => {
    const { request, response } = mockReqResNext({});

    const error = await getThrownError(() => signup(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toContain("required property 'email'");
  });

  it("Calls sendEmail", async () => {
    const { request, response } = mockReqResNext({ email: "leo@dog.com" });

    await signup(request, response);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith("leo@dog.com");
  });
});
