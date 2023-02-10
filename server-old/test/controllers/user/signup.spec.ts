import { mockReqResNext, getRejection } from "../../testUtils";
import signup from "../../../src/controllers/user/signup";
import { ClientError } from "../../../src/util/errors";

// Mocks
import * as mail from "../../../src/util/email";
import { User } from "../../../src/database/models";
import { accessToken, signupToken } from "../../../src/util/auth";

jest.mock("../../../src/util/email");
jest.mock("../../../src/database/models");
jest.mock("../../../src/util/auth");

const MockedUser = User as jest.Mocked<typeof User>;
const mockMail = mail as jest.Mocked<typeof mail>;
const mockAccessToken = accessToken as jest.Mocked<typeof accessToken>;
const mockSignupToken = signupToken as jest.Mocked<typeof signupToken>;

describe("signup", () => {
  it("throws ClientError if email is missing from body", async () => {
    const { request, response } = mockReqResNext({ body: {} });

    const error = await getRejection(() => signup(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toContain("required property 'email'");
  });

  describe("when user already exists", () => {
    it("Sends an existing user email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });
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

    it("generates an access token with user's publicId", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

      MockedUser.findByEmail.mockImplementationOnce(
        async () => ({ publicId: "leo" } as User)
      );
      mockAccessToken.generate.mockImplementationOnce(() => "leotoken");

      await signup(request, response);
      expect(mockAccessToken.generate).toHaveBeenCalledWith("leo");
    });

    it("Includes a link with access token in email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

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
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });
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

    it("generates a signup token with user's email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      mockSignupToken.generate.mockImplementationOnce(() => "leotoken");

      await signup(request, response);

      expect(mockSignupToken.generate).toHaveBeenCalledWith("leo@dog.com");
    });

    it("Includes a link with signup token in email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      mockSignupToken.generate.mockImplementationOnce(() => "leotoken");

      await signup(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const [{ html }] = mockMail.sendMail.mock.calls[0];

      expect(html).toMatch(/href="http:\/\/localhost:3000\?signup=leotoken"/);
    });
  });
});
