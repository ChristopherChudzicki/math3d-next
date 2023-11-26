import { test, expect } from "vitest";
import {
  renderTestApp,
  screen,
  user,
  seedDb,
  within,
  waitFor,
} from "@/test_util";

const getSignInLink = () => {
  const nav = screen.getByRole("navigation", { hidden: true });
  const signin = within(nav).getByRole("link", {
    name: "Sign in",
    hidden: true,
  });
  return signin;
};

test("Login form logs user in", async () => {
  const userData = seedDb.withUser();

  const { location } = await renderTestApp("/auth/login", {});

  const signin = getSignInLink();
  expect(signin).toBeInTheDocument();

  const dialog = screen.getByRole("dialog");
  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });
  await user.click(email);
  user.paste(userData.email);

  await user.click(password);
  user.paste(userData.password);

  expect(signin).toBeInTheDocument();
  await user.click(submit);
  expect(signin).not.toBeInTheDocument();

  // Re-routed and dialog closed
  expect(location.current.pathname).toBe("/");
  expect(dialog).not.toBeInTheDocument();
});

test("Login form displays error if password/email wrong", async () => {
  const userData = seedDb.withUser();

  await renderTestApp("/auth/login", {});
  const dialog = screen.getByRole("dialog");

  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });
  await user.click(email);
  user.paste(userData.email);

  await user.click(password);
  user.paste("foo");

  await user.click(submit);
  const alert = within(dialog).getByRole("alert");
  expect(alert).toHaveTextContent("Email or password is incorrect.");

  // Sign-in link still visible
  expect(getSignInLink()).toBeInTheDocument();
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
