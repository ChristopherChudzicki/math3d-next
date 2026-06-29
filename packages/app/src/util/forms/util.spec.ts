import { test, expect, vi } from "vitest";
import { ApiError } from "@math3d/api";
import { setFieldErrors } from "./util";

const makeApiError = (status: number, data: unknown): ApiError =>
  new ApiError(status, data, new Response(null, { status }));

test("allauth: maps an error whose param is a form field to that field", () => {
  const setError = vi.fn();
  const err = makeApiError(400, {
    status: 400,
    errors: [
      { code: "invalid", message: "Enter a valid email.", param: "email" },
    ],
  });

  const result = setFieldErrors({ email: "" }, err, setError);

  expect(result).toBe(true);
  expect(setError).toHaveBeenCalledWith("email", {
    type: "400",
    message: "Enter a valid email.",
  });
});

test("allauth: treats ROOT_ERROR_CODES as a root error despite a param", () => {
  const setError = vi.fn();
  const err = makeApiError(400, {
    status: 400,
    errors: [
      {
        code: "email_password_mismatch",
        message: "Incorrect credentials.",
        param: "password",
      },
    ],
  });

  setFieldErrors({ email: "", password: "" }, err, setError);

  expect(setError).toHaveBeenCalledWith("root", {
    type: "400",
    message: "Incorrect credentials.",
  });
  expect(setError).not.toHaveBeenCalledWith("password", expect.anything());
});

test("allauth: surfaces an error as root when its param is not a form field", () => {
  const setError = vi.fn();
  const err = makeApiError(400, {
    status: 400,
    errors: [
      { code: "invalid", message: "Unexpected field.", param: "not_a_field" },
    ],
  });

  const result = setFieldErrors({ email: "" }, err, setError);

  expect(result).toBe(true);
  expect(setError).toHaveBeenCalledWith("root", {
    type: "400",
    message: "Unexpected field.",
  });
});

test("v1 field errors: maps field errors and non_field_errors to fields and root", () => {
  const setError = vi.fn();
  const err = makeApiError(400, {
    password: ["Too short."],
    non_field_errors: ["Something is off."],
  });

  setFieldErrors({ password: "" }, err, setError);

  expect(setError).toHaveBeenCalledWith("password", {
    type: "400",
    message: "Too short.",
  });
  expect(setError).toHaveBeenCalledWith("root", {
    type: "400",
    message: "Something is off.",
  });
});

test("handles 409 (conflict) errors, not just 400", () => {
  const setError = vi.fn();
  const err = makeApiError(409, {
    status: 409,
    errors: [{ code: "conflict", message: "Already exists.", param: "email" }],
  });

  const result = setFieldErrors({ email: "" }, err, setError);

  expect(result).toBe(true);
  expect(setError).toHaveBeenCalledWith("email", {
    type: "400",
    message: "Already exists.",
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
