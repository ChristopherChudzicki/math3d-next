import { test, expect } from "vitest";
import {
  renderTestApp,
  screen,
  user,
  within,
  getDescribedBy,
} from "@/test_util";
import { faker } from "@faker-js/faker";
import { urls } from "@math3d/mock-api";
import { mockResponseOnce } from "@math3d/mock-api/node";

type FormValues = {
  email: string;
  nickname: string;
  password: string;
  rePassword: string;
};

const submitForm = async (data: FormValues) => {
  const dialog = screen.getByRole("dialog");
  const fields = {
    email: within(dialog).getByRole("textbox", { name: "Email" }),
    nickname: within(dialog).getByRole("textbox", {
      name: "Public Nickname",
    }),
    password: within(dialog).getByLabelText("Password"),
    rePassword: within(dialog).getByLabelText("Confirm Password"),
  };

  await user.click(fields.email);
  await user.paste(data.email);

  await user.click(fields.nickname);
  await user.paste(data.nickname);

  await user.click(fields.password);
  await user.paste(data.password);

  await user.click(fields.rePassword);
  await user.paste(data.rePassword);

  await user.click(
    within(dialog).getByRole("button", { name: "Create Account" }),
  );

  return fields;
};

test("Displays client-side form errors", async () => {
  await renderTestApp("/auth/register");
  const fields = await submitForm({
    email: "",
    nickname: "",
    password: "cats", // pragma: allowlist secret
    rePassword: "dogs", // pragma: allowlist secret
  });

  expect(getDescribedBy(fields.email)).toHaveTextContent(
    "Email is a required field",
  );
  expect(getDescribedBy(fields.nickname)).toHaveTextContent(
    "Public nickname is a required field",
  );
  expect(getDescribedBy(fields.password)).toHaveTextContent(
    "Password must be at least 9 characters",
  );
  expect(getDescribedBy(fields.rePassword)).toHaveTextContent(
    "Passwords must match",
  );
});

test("Server errors are reflected in form", async () => {
  mockResponseOnce({
    status: 400,
    url: urls.auth.users,
    method: "post",
    data: {
      email: ["email field error"],
      password: ["password field error"],
    },
  });

  await renderTestApp("/auth/register");
  const fields = await submitForm({
    email: "leo@dog.com",
    nickname: "leo",
    password: "woofwoofmeow", // pragma: allowlist secret
    rePassword: "woofwoofmeow", // pragma: allowlist secret
  });

  expect(getDescribedBy(fields.email)).toHaveTextContent("email field error");
  expect(getDescribedBy(fields.password)).toHaveTextContent(
    "password field error",
  );
});

test("non_field_errors are shown in an alert", async () => {
  mockResponseOnce({
    status: 400,
    url: urls.auth.users,
    method: "post",
    data: {
      non_field_errors: ["overall error message"],
    },
  });

  await renderTestApp("/auth/register");
  await submitForm({
    email: "leo@dog.com",
    nickname: "leo",
    password: "woofwoofmeow", // pragma: allowlist secret
    rePassword: "woofwoofmeow", // pragma: allowlist secret
  });
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("overall error message");
});

test("Informs user about confirmation email", async () => {
  const { location } = await renderTestApp("/auth/register");
  const userInfo = {
    email: faker.internet.email(),
    nickname: faker.person.firstName(),
    password: faker.internet.password(),
  };
  await submitForm({
    ...userInfo,
    rePassword: userInfo.password,
  });
  screen.getByRole("heading", { name: "Confirmation Required" });
  expect(screen.queryByRole("button", { name: "Cancel" })).toBe(null);
  await user.click(screen.getByRole("button", { name: "OK" }));
  expect(location.current.pathname).toBe("/");
});
