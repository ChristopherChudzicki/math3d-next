import { mockReqResNext } from "../testUtils";
import attachContext from "../../src/middleware/attachContext";

describe("attachContext", () => {
  it("attaches a context object to the request", () => {
    const { request, response, next } = mockReqResNext();
    expect(request.context).toBeUndefined();
    attachContext(request, response, next);
    expect(request.context).not.toBeUndefined();
  });
});
