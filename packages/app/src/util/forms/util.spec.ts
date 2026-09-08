import { test, expect, vi } from "vitest";
import { ApiError } from "@math3d/api";
import { setFieldErrors } from "./util";

const makeApiError = (status: number, data: unknown): ApiError =>
  new ApiError(status, data, new Response(null, { status }));

test("v1 field errors: maps field errors and non_field_errors to fields and root", () => {
  const setError = vi.fn();
  const err = makeApiError(400, {
    title: ["Too short."],
    non_field_errors: ["Something is off."],
  });

  setFieldErrors({ title: "" }, err, setError);

  expect(setError).toHaveBeenCalledWith("title", {
    type: "400",
    message: "Too short.",
  });
  expect(setError).toHaveBeenCalledWith("root", {
    type: "400",
    message: "Something is off.",
  });
});

test("non-400/409 errors set a generic root message and rethrow", () => {
  const setError = vi.fn();
  const err = makeApiError(500, { detail: "server error" });

  expect(() => setFieldErrors({ email: "" }, err, setError)).toThrow(err);
  expect(setError).toHaveBeenCalledWith("root", {
    message: "Something went wrong. Please try again later.",
  });
});
