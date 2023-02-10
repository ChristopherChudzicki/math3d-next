import { sendErrorResponse } from "../../src/middleware";
import { ClientError } from "../../src/util/errors";
import { mockReqResNext } from "../testUtils";

describe("sendErrorResponse", () => {
  describe("when error is an instance of ClientError", () => {
    class MyClientError extends ClientError {}

    const error = new MyClientError("I'm a teapot", 418);
    const { request, response, next } = mockReqResNext();

    it("Includes the error message in response", () => {
      sendErrorResponse(error, request, response, next);
      expect(response.json).toHaveBeenCalledWith({
        error: "Error: I'm a teapot",
      });
    });

    it("uses the error status from ClientError", () => {
      sendErrorResponse(error, request, response, next);
      expect(response.status).toHaveBeenCalledWith(418);
    });

    it("calls next with error", () => {
      sendErrorResponse(error, request, response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("when error is not a ClientError", () => {
    const error = new Error("Something Terrible");
    const { request, response, next } = mockReqResNext();

    it("shows a generic error message", () => {
      sendErrorResponse(error, request, response, next);
      expect(response.json).toHaveBeenCalledWith({
        error: "Error: Internal Error",
      });
    });

    it("uses 500 as status", () => {
      sendErrorResponse(error, request, response, next);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });
});
