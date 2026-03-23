import { test, expect } from "vitest";
import { faker } from "@faker-js/faker/locale/en";
import {
  getDescribedBy,
  renderTestApp,
  screen,
  user,
  within,
} from "@/test_util";
import invariant from "tiny-invariant";
import { urls } from "@math3d/mock-api";
import { mockResponseOnce } from "@math3d/mock-api/node";

type FormValues = {
  password: string;
  rePassword: string;
};

const submitForm = async (data: FormValues) => {
  const dialog = screen.getByRole("dialog");
  const controls = {
    password: within(dialog).getByLabelText("New Password"),
    rePassword: within(dialog).getByLabelText("Confirm New Password"),
    cancel: within(dialog).getByRole("button", { name: "Cancel" }),
    submit: within(dialog).getByRole("button", { name: "Change Password" }),
  };

  await user.click(controls.password);
  await user.paste(data.password);

  await user.click(controls.rePassword);
  await user.paste(data.rePassword);

  await user.click(
    within(dialog).getByRole("button", { name: "Change Password" }),
  );

  return controls;
};

test("Happy path: Expected API call and form states", async () => {
  const key = `${faker.string.alpha({ length: 2 })}-${faker.string.uuid()}`;
  const { location } = await renderTestApp(
    `/auth/reset-password/confirm?key=${key}`,
  );

  const dialog = await screen.findByRole("dialog");

  within(dialog).getByRole("heading", {
    name: "Change Password",
  });

  const password = faker.internet.password();
  const controls = await submitForm({ password, rePassword: password });

  const alert = within(dialog).getByRole("alert");
  expect(alert.textContent).toMatch(/Password changed./);
  const link = within(alert).getByRole("link", { name: "log in" });
  invariant(link instanceof HTMLAnchorElement);
  expect(link.href).toBe(`${window.origin}/auth/login`);

  expect(controls.submit.textContent).toBe("Go to login");
  expect(controls.cancel).not.toBeInTheDocument();

  await user.click(controls.submit);
  expect(location.current.pathname).toBe("/auth/login");
});

test("Requires passwords match", async () => {
  const key = `${faker.string.alpha({ length: 2 })}-${faker.string.uuid()}`;
  await renderTestApp(`/auth/reset-password/confirm?key=${key}`);

  const controls = await submitForm({
    password: "Password1234", // pragma: allowlist secret
    rePassword: "Password1235", // pragma: allowlist secret
  });
  expect(getDescribedBy(controls.rePassword)).toHaveTextContent(
    "Passwords must match",
  );
});

test("Reports API errors (password field)", async () => {
  const key = `${faker.string.alpha({ length: 2 })}-${faker.string.uuid()}`;
  await renderTestApp(`/auth/reset-password/confirm?key=${key}`);

  mockResponseOnce({
    status: 400,
    url: urls.auth.resetPassword,
    method: "post",
    data: {
      status: 400,
      errors: [
        {
          code: "invalid",
          message: "password field error",
          param: "password",
        },
      ],
    },
  });

  const controls = await submitForm({
    password: "Password1234", // pragma: allowlist secret
    rePassword: "Password1234", // pragma: allowlist secret
  });

  expect(getDescribedBy(controls.password)).toHaveTextContent(
    "password field error",
  );
});

test("key errors suggest to check link", async () => {
  const key = `${faker.string.alpha({ length: 2 })}-${faker.string.uuid()}`;
  await renderTestApp(`/auth/reset-password/confirm?key=${key}`);

  mockResponseOnce({
    status: 400,
    url: urls.auth.resetPassword,
    method: "post",
    data: {
      status: 400,
      errors: [
        {
          code: "token_invalid",
          message: "The password reset token was invalid.",
          param: "key",
        },
      ],
    },
  });

  await submitForm({
    password: "Password1234", // pragma: allowlist secret
    rePassword: "Password1234", // pragma: allowlist secret
  });

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toMatch(
    /Please check that the password reset link/,
  );
});
