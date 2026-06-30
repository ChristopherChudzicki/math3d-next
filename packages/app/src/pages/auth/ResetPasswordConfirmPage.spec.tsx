import { test, expect } from "vitest";
import { faker } from "@faker-js/faker/locale/en";
import {
  getDescribedBy,
  renderTestApp,
  screen,
  user,
  waitFor,
} from "@/test_util";
import { urls } from "@math3d/mock-api";
import { mockResponseOnce } from "@math3d/mock-api/node";

type FormValues = {
  password: string;
  rePassword: string;
};

const makeKey = () =>
  `${faker.string.alpha({ length: 2 })}-${faker.string.uuid()}`;

const submitForm = async (data: FormValues) => {
  const controls = {
    password: screen.getByLabelText("New Password"),
    rePassword: screen.getByLabelText("Confirm New Password"),
    submit: screen.getByRole("button", { name: "Change Password" }),
  };

  await user.click(controls.password);
  await user.paste(data.password);

  await user.click(controls.rePassword);
  await user.paste(data.rePassword);

  await user.click(controls.submit);

  return controls;
};

test("reset-confirm page loads at the exact email-link path (trailing slash)", async () => {
  await renderTestApp(
    `/app/auth/reset-password/confirm/?key=${faker.string.uuid()}`,
  );
  expect(
    await screen.findByRole("heading", { name: "Change Password" }),
  ).toBeVisible();
});

test("Happy path: Expected API call and form states", async () => {
  const key = makeKey();
  const { location } = await renderTestApp(
    `/app/auth/reset-password/confirm?key=${key}`,
  );

  await screen.findByRole("heading", { name: "Change Password" });

  const password = faker.internet.password();
  await submitForm({ password, rePassword: password });

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toMatch(/Password changed./);
  const link = screen.getByRole("link", { name: "log in" });
  expect(link).toHaveAttribute("href", "/?overlay=login");

  const goToLoginButton = screen.getByRole("button", { name: "Go to login" });
  await user.click(goToLoginButton);
  await waitFor(() => expect(location.current.pathname).toBe("/"));
  expect(location.current.search).toContain("overlay=login");
});

test("Requires passwords match", async () => {
  const key = makeKey();
  await renderTestApp(`/app/auth/reset-password/confirm?key=${key}`);

  const controls = await submitForm({
    password: "Password1234", // pragma: allowlist secret
    rePassword: "Password1235", // pragma: allowlist secret
  });
  expect(getDescribedBy(controls.rePassword)).toHaveTextContent(
    "Passwords must match",
  );
});

test("Reports API errors (password field)", async () => {
  const key = makeKey();
  await renderTestApp(`/app/auth/reset-password/confirm?key=${key}`);

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
  const key = makeKey();
  await renderTestApp(`/app/auth/reset-password/confirm?key=${key}`);

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
