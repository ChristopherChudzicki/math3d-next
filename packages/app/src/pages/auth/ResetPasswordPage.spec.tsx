import { test, expect } from "vitest";
import { faker } from "@faker-js/faker/locale/en";
import {
  getDescribedBy,
  renderTestApp,
  screen,
  user,
  within,
} from "@/test_util";

test("Hapy path: Expected API call and form states", async () => {
  const { location } = await renderTestApp("/auth/reset-password");

  const dialog = screen.getByRole("dialog");
  const controls = {
    email: within(dialog).getByRole("textbox", { name: "Email" }),
    submit: within(dialog).getByRole("button", { name: "Reset Password" }),
    cancel: within(dialog).getByRole("button", { name: "Cancel" }),
  };

  const title = within(dialog).getByRole("heading", { name: "Reset Password" });

  const email = faker.internet.email();
  await user.click(controls.email);
  await user.paste(email);

  await user.click(controls.submit);

  const alert = within(dialog).getByRole("alert");
  expect(alert.textContent).toMatch(/reset your password/);
  expect(alert.textContent).toContain(email);

  expect(title.textContent).toBe("Confirmation Required");
  expect(controls.submit.textContent).toBe("OK");
  expect(controls.cancel).not.toBeInTheDocument();

  await user.click(controls.submit);
  expect(location.current.pathname).toBe("/");
});

test("Form requires email", async () => {
  await renderTestApp("/auth/reset-password");

  const dialog = screen.getByRole("dialog");
  const controls = {
    email: within(dialog).getByRole("textbox", { name: "Email" }),
    submit: within(dialog).getByRole("button", { name: "Reset Password" }),
    cancel: within(dialog).getByRole("button", { name: "Cancel" }),
  };

  await user.click(controls.submit);
  expect(getDescribedBy(controls.email).textContent).toMatch(/required/);
});
