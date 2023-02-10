import { mockReqResNext, getThrownError } from "../testUtils";
import attachContext, { Context } from "../../src/middleware/attachContext";
import { ClientError } from "../../src/util/errors";
import { accessToken } from "../../src/util/auth";

const setValidatedUserIdSpy = jest.spyOn(
  Context.prototype,
  "setValidatedUserId"
);

describe("Context object", () => {
  describe("constructor", () => {
    it("instantiates without authentication", () => {
      const context = new Context();
      expect(context.hasValidAccessToken).toBe(false);
      expect(context.userId).toBeUndefined();
    });
  });

  describe("context.setValidatedUserId", () => {
    it("sets userId", () => {
      const context = new Context();
      expect(context.userId).toBeUndefined();
      context.setValidatedUserId("someUserId");
      expect(context.userId).toBe("someUserId");
    });

    it("sets hasValidAccessToken to true", () => {
      const context = new Context();
      expect(context.hasValidAccessToken).toBe(false);
      context.setValidatedUserId("someUserId");
      expect(context.hasValidAccessToken).toBe(true);
    });
  });

  describe("Context.mustGetUserId", () => {
    it("returns userId if has been set", () => {
      const context = new Context();
      context.setValidatedUserId("someUserId");
      expect(context.mustGetUserId()).toBe("someUserId");
    });

    it("throws a 403 if userId has not been set", async () => {
      const context = new Context();

      const error: ClientError = getThrownError(context.mustGetUserId);
      expect(error).toBeInstanceOf(ClientError);
      expect(error.status).toBe(403);
      expect(String(error)).toMatch(/Forbidden/);
    });
  });
});

describe("attachContext", () => {
  it("attaches a context object to the request", () => {
    const { request, response, next } = mockReqResNext();
    expect(request.context).toBeUndefined();
    attachContext(request, response, next);
    expect(request.context).toBeInstanceOf(Context);
  });

  describe("when no auth header is sent", () => {
    it("it does NOT call context.setValidatedUserId", () => {
      const { request, response, next } = mockReqResNext();
      attachContext(request, response, next);
      expect(setValidatedUserIdSpy).not.toHaveBeenCalled();
    });

    it("it DOES call next", () => {
      const { request, response, next } = mockReqResNext();
      attachContext(request, response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("when invalid auth header is sent", () => {
    it("it does NOT call context.setValidatedUserId", () => {
      const { request, response, next } = mockReqResNext({
        headers: {
          authorization: "Bearer some-invalid-token",
        },
      });
      attachContext(request, response, next);
      expect(setValidatedUserIdSpy).not.toHaveBeenCalled();
    });

    it("it DOES call next", () => {
      const { request, response, next } = mockReqResNext({
        headers: {
          authorization: "Bearer some-invalid-token",
        },
      });
      attachContext(request, response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("when valid auth header is sent", () => {
    it("it calls context.setValidatedUserId", () => {
      const token = accessToken.generate("leoTheDog");
      const { request, response, next } = mockReqResNext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      attachContext(request, response, next);
      expect(setValidatedUserIdSpy).toHaveBeenCalledTimes(1);
      expect(setValidatedUserIdSpy).toHaveBeenCalledWith("leoTheDog");
    });

    it("it DOES call next", () => {
      const token = accessToken.generate("leoTheDog");
      const { request, response, next } = mockReqResNext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      attachContext(request, response, next);
      expect(setValidatedUserIdSpy).toHaveBeenCalledTimes(1);
      expect(setValidatedUserIdSpy).toHaveBeenCalledWith("leoTheDog");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
