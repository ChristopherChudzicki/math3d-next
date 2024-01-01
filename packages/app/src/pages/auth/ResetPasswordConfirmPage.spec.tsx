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
import { mockResponseOnce, urls } from "@/test_util/msw";

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

test("Hapy path: Expected API call and form states", async () => {
  const token = faker.datatype.uuid();
  const uid = faker.datatype.string(2);
  const { location } = await renderTestApp(
    `/auth/reset-password/confirm?uid=${uid}&token=${token}`,
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
  const token = faker.datatype.uuid();
  const uid = faker.datatype.string(2);
  await renderTestApp(`/auth/reset-password/confirm?uid=${uid}&token=${token}`);

  const controls = await submitForm({
    password: "Password1234", // pragma: allowlist secret
    rePassword: "Password1235", // pragma: allowlist secret
  });
  expect(getDescribedBy(controls.rePassword)).toHaveTextContent(
    "Passwords must match",
  );
});

test("Reports API errors (password field)", async () => {
  const token = faker.datatype.uuid();
  const uid = faker.datatype.string(2);
  await renderTestApp(`/auth/reset-password/confirm?uid=${uid}&token=${token}`);

  mockResponseOnce({
    status: 400,
    url: urls.auth.resetPasswordConfirm,
    method: "post",
    data: {
      new_password: ["password field error"],
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

test.each([
  { errData: { uid: ["uid error"] } },
  { errData: { token: ["token error"] } },
])("token or uid errors suggest to check link", async ({ errData }) => {
  const token = faker.datatype.uuid();
  const uid = faker.datatype.string(2);
  await renderTestApp(`/auth/reset-password/confirm?uid=${uid}&token=${token}`);
  mockResponseOnce({
    status: 400,
    url: urls.auth.resetPasswordConfirm,
    method: "post",
    data: errData,
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
