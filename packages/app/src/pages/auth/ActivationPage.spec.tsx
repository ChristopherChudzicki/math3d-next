import { test, expect } from "vitest";
import { renderTestApp, screen, user, within } from "@/test_util";
import { faker } from "@faker-js/faker/locale/en";
import { mockResponseOnce, urls } from "@/test_util/msw";

test("Authorization form happy path: API call, success indication, & log in", async () => {
  const token = faker.datatype.uuid();
  const uid = faker.datatype.string(2);
  const url = `/auth/activate-account?uid=${uid}&token=${token}`;
  const { location } = await renderTestApp(url, {});
  const dialog = screen.getByRole("dialog", { name: "Account Activation" });
  const alert = await within(dialog).findByRole("alert");
  expect(alert).toHaveTextContent(/activated/);
  within(dialog).getByRole("link", { name: "log in" });
  const button = within(dialog).getByRole("button", { name: "Go to login" });
  await user.click(button);
  expect(location.current.pathname).toBe("/auth/login");
});

test("Error message for invalid token/uid", async () => {
  mockResponseOnce({
    status: 400,
    url: urls.auth.activation,
    method: "post",
    data: {},
  });
  await renderTestApp("/auth/activate-account?uid=fake&token=faker", {});
  const dialog = await screen.findByRole("dialog", {
    name: "Account Activation",
  });
  const alert = await within(dialog).findByRole("alert");
  expect(alert).toHaveTextContent(/activated/);
});
