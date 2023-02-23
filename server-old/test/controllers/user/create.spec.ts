import { accessToken, signupToken } from "../../../src/util/auth";
import { mockReqResNext, getRejection } from "../../testUtils";
import createUser from "../../../src/controllers/user/create";
import { ClientError } from "../../../src/util/errors";

// Mocks
import { User } from "../../../src/database/models";

jest.mock("../../../src/database/models");

const MockedUser = User as jest.Mocked<typeof User>;

describe("creating users", () => {
  it("throws if body is missing username", async () => {
    const { request, response } = mockReqResNext({ body: {} });
    const error = await getRejection(() => createUser(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toMatch(/required property 'username'/);
  });

  it("throws if username is fewer than 3 characters", async () => {
    const { request, response } = mockReqResNext({
      body: { username: "cc" },
    });
    const error = await getRejection(() => createUser(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toMatch(/must NOT have fewer than 3 characters/);
  });

  it("throws if signup token is invalid", async () => {
    const { request, response } = mockReqResNext({
      body: { username: "leo" },
      headers: { authorization: "Bearer invalidtoken" },
    });
    const error = await getRejection(() => createUser(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
  });

  it("throws if user exists already", async () => {
    const token = signupToken.generate("leo@dog.com");
    const { request, response } = mockReqResNext({
      body: { username: "leo" },
      headers: { authorization: `Bearer ${token}` },
    });
    MockedUser.findByEmail.mockImplementationOnce(async () => ({} as User));
    const error = await getRejection(() => createUser(request, response));

    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(400);
    expect(String(error)).toMatch(/"leo@dog\.com" already exists/);
  });

  it("creates a user", async () => {
    const token = signupToken.generate("leo@dog.com");
    const { request, response } = mockReqResNext({
      body: { username: "leo" },
      headers: { authorization: `Bearer ${token}` },
    });
    MockedUser.findByEmail.mockImplementationOnce(async () => null);
    MockedUser.create.mockImplementationOnce(async () => ({
      publicId: "leoId",
    }));
    await createUser(request, response);
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(response.json).toHaveBeenCalledWith({
      result: { userId: "leoId", token: accessToken.generate("leoId") },
    });
  });
});
