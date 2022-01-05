import { mockReqResNext, getThrownError } from "../../testUtils";
import signup from "../../../src/controllers/user/signup";
import { ClientError } from "../../../src/util/errors";

// Mocks
import * as mail from "../../../src/util/email";
import { User } from "../../../src/database/models";
import { accessToken, signupToken } from "../../../src/util/tokens";

jest.mock("../../../src/util/email");
jest.mock("../../../src/database/models");
jest.mock("../../../src/util/tokens");

const MockedUser = User as jest.Mocked<typeof User>;
const mockMail = mail as jest.Mocked<typeof mail>;
const mockAccessToken = accessToken as jest.Mocked<typeof accessToken>;
const mockSignupToken = signupToken as jest.Mocked<typeof signupToken>;

describe("signup", () => {
  it("throws ClientError if email is missing from body", async () => {
    const { request, response } = mockReqResNext({});

    const error = await getThrownError(() => signup(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toContain("required property 'email'");
  });

  describe("when user already exists", () => {
    it("Sends an existing user email", async () => {
      const { request, response } = mockReqResNext({ email: "leo@dog.com" });
      MockedUser.findByEmail.mockImplementationOnce(async () => ({} as User));
      await signup(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      expect(mail.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "leo@dog.com",
          subject: "Math3d Signup (Existing User)",
        })
      );
    });

    it("Includes a link with signup token in email", async () => {
      const { request, response } = mockReqResNext({ email: "leo@dog.com" });

      MockedUser.findByEmail.mockImplementationOnce(async () => ({} as User));
      mockAccessToken.generate.mockImplementationOnce(() => "leotoken");

      await signup(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const [{ html }] = mockMail.sendMail.mock.calls[0];

      expect(html).toMatch(/href="http:\/\/localhost:3000\?login=leotoken"/);
    });
  });

  describe("when user does not exist yet", () => {
    it("Sends a new user email", async () => {
      const { request, response } = mockReqResNext({ email: "leo@dog.com" });
      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      await signup(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      expect(mail.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "leo@dog.com",
          subject: "Math3d Signup",
        })
      );
    });

    it("Includes a link with signup token in email", async () => {
      const { request, response } = mockReqResNext({ email: "leo@dog.com" });

      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      mockSignupToken.generate.mockImplementationOnce(() => "leotoken");

      await signup(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const [{ html }] = mockMail.sendMail.mock.calls[0];

      expect(html).toMatch(/href="http:\/\/localhost:3000\?signup=leotoken"/);
    });
  });
});
