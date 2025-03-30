import { test, expect } from "vitest";
import { renderTestApp, screen, user, within, waitFor } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

const findSignInLink = async () => {
  const signin = await screen.findByRole("link", {
    name: "Sign in",
    hidden: true,
  });
  return signin;
};

test("Login form logs user in", async () => {
  const userData = seedDb.withUser();

  const { location } = await renderTestApp("/auth/login", {});

  const signin = await findSignInLink();
  expect(signin).toBeInTheDocument();

  const dialog = await screen.findByRole("dialog");
  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });
  await user.click(email);
  await user.paste(userData.email);

  await user.click(password);
  await user.paste(userData.password);

  expect(signin).toBeInTheDocument();
  await user.click(submit);
  expect(signin).not.toBeInTheDocument();

  // Re-routed and dialog closed
  expect(location.current.pathname).toBe("/");
  await waitFor(() => {
    expect(dialog).not.toBeInTheDocument();
  });
});

test("Login form displays error if password/email wrong", async () => {
  const userData = seedDb.withUser();

  await renderTestApp("/auth/login", {});

  const dialog = await screen.findByRole("dialog");

  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });
  await user.click(email);
  await user.paste(userData.email);

  await user.click(password);
  await user.paste("foo");

  await user.click(submit);
  const alert = within(dialog).getByRole("alert");
  expect(alert).toHaveTextContent(
    "Unable to log in with provided credentials.",
  );

  // Sign-in link still visible
  expect(await findSignInLink()).toBeInTheDocument();
  // Dialog still open
  expect(dialog).toBeInTheDocument();
});

test("If authenticated already, redirects to main", async () => {
  const { location } = await renderTestApp("/auth/login", {
    isAuthenticated: true,
  });
  await waitFor(() => {
    expect(location.current.pathname).toBe("/");
  });
});
