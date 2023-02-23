import { mockReqResNext, getRejection } from "../../testUtils";
import login from "../../../src/controllers/user/login";
import { ClientError } from "../../../src/util/errors";

// Mocks
import * as mail from "../../../src/util/email";
import { User } from "../../../src/database/models";
import { accessToken } from "../../../src/util/auth";

jest.mock("../../../src/util/email");
jest.mock("../../../src/database/models");
jest.mock("../../../src/util/auth");

const MockedUser = User as jest.Mocked<typeof User>;
const mockMail = mail as jest.Mocked<typeof mail>;
const mockAccessToken = accessToken as jest.Mocked<typeof accessToken>;

describe("login", () => {
  it("throws ClientError if email is missing from body", async () => {
    const { request, response } = mockReqResNext({ body: {} });

    const error = await getRejection(() => login(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toContain("required property 'email'");
  });

  describe("when user exists", () => {
    it("Sends a login email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });
      MockedUser.findByEmail.mockImplementationOnce(async () => ({} as User));
      await login(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      expect(mail.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "leo@dog.com",
          subject: "Math3d Login",
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

      await login(request, response);
      expect(mockAccessToken.generate).toHaveBeenCalledWith("leo");
    });

    it("Includes a link with signup token in email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

      MockedUser.findByEmail.mockImplementationOnce(
        async () => ({ publicId: "leo" } as User)
      );
      mockAccessToken.generate.mockImplementationOnce(() => "leotoken");

      await login(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const [{ html }] = mockMail.sendMail.mock.calls[0];

      expect(html).toMatch(/href="http:\/\/localhost:3000\?login=leotoken"/);
    });

    it("Sends a 200 response with result: true", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });

      MockedUser.findByEmail.mockImplementationOnce(async () => ({} as User));
      mockAccessToken.generate.mockImplementationOnce(() => "leotoken");

      await login(request, response);

      expect(response.json).toHaveBeenCalledTimes(1);
      expect(response.json).toHaveBeenCalledWith({ result: true });
    });
  });

  describe("when user does not exist yet", () => {
    it("Does not send an email", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });
      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      await login(request, response);

      expect(mail.sendMail).toHaveBeenCalledTimes(0);
    });

    it("Returns 200 response", async () => {
      const { request, response } = mockReqResNext({
        body: { email: "leo@dog.com" },
      });
      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      await login(request, response);

      expect(response.json).toHaveBeenCalledTimes(1);
      expect(response.json).toHaveBeenCalledWith({ result: true });
    });
  });
});
