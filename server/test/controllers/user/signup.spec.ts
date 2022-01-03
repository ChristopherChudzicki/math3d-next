import { mockReqResNext, getThrownError } from "../../testUtils";
import signup from "../../../src/controllers/user/signup";
import { ClientError } from "../../../src/util/errors";

// Mocks
import { sendEmail } from "../../../src/util/email";
import { User } from "../../../src/database/models";

jest.mock("../../../src/util/email");
jest.mock("../../../src/database/models");

const MockedUser = User as jest.Mocked<typeof User>;

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

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        "leo@dog.com",
        "existingUserEmail"
      );
    });
  });

  describe("when user does not exist yet", () => {
    it("Sends a new user email", async () => {
      const { request, response } = mockReqResNext({ email: "leo@dog.com" });
      MockedUser.findByEmail.mockImplementationOnce(async () => null);
      await signup(request, response);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith("leo@dog.com", "newUserEmail");
    });
  });
});
