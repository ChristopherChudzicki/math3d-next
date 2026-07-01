import { test, expect } from "vitest";
import { renderTestApp, screen, user, within, waitFor, act } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

test("Login form logs user in", async () => {
  const userData = seedDb.withUser();
  const { location } = await renderTestApp("/?overlay=login");

  const dialog = await screen.findByRole("dialog");
  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });

  await user.click(email);
  await user.paste(userData.email);
  await user.click(password);
  await user.paste(userData.password);
  await user.click(submit);

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(location.current.search).not.toContain("overlay=");
});

test("Login form displays error if password/email wrong", async () => {
  const userData = seedDb.withUser();

  await renderTestApp("/?overlay=login");

  const dialog = await screen.findByRole("dialog");

  const email = within(dialog).getByRole("textbox", { name: "Email" });
  const password = within(dialog).getByLabelText("Password");
  const submit = within(dialog).getByRole("button", { name: "Sign in" });
  await user.click(email);
  await user.paste(userData.email);

  await user.click(password);
  await user.paste("foo");

  await user.click(submit);
  // allauth's email_password_mismatch error is treated as a form-level error
  const alert = within(dialog).getByRole("alert");
  expect(alert).toHaveTextContent(
    "The email address and/or password you specified are not correct.",
  );

  // Dialog still open
  expect(dialog).toBeInTheDocument();
});

test("If authenticated already, closes the overlay", async () => {
  const { location } = await renderTestApp("/?overlay=login", {
    isAuthenticated: true,
  });
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("Create Account link switches to the register overlay (replace, no extra history)", async () => {
  // Seed the scene so the scene query does NOT 404 — otherwise the "Not found"
  // notification <Dialog> mounts alongside the overlay and a bare findByRole("dialog")
  // throws "multiple elements". (Always seed, or scope dialog queries by name.)
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(`/${scene.key}?overlay=login`);
  await screen.findByRole("dialog", { name: "Sign in" });
  await user.click(screen.getByRole("button", { name: "Create Account" }));
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=register"),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`); // path (scene) preserved
});

test("open pushes one history entry; Back returns to the underlying view", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location, router } = await renderTestApp(`/${scene.key}`);
  // open login from the header trigger
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toContain("overlay=login");
  await act(() => router.navigate(-1));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

test("switching login → register does not add a history entry (Back skips both)", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location, router } = await renderTestApp(`/${scene.key}`);
  // Open login overlay (push → now 2 history entries)
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  // Switch to register (replace → still 2 entries, login never pushed again)
  await user.click(screen.getByRole("button", { name: "Create Account" }));
  await screen.findByRole("dialog", { name: /create account/i });
  // Back once should skip both overlays (replace means login→register was not a push)
  await act(() => router.navigate(-1));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("opening/closing an overlay preserves other params and the hash", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(`/${scene.key}?controls=0#frag`);
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toContain("controls=0");
  expect(location.current.hash).toBe("#frag");
  await user.click(screen.getByRole("button", { name: "Close" })); // BasicDialog close
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.search).toContain("controls=0"); // merged, not clobbered
  expect(location.current.hash).toBe("#frag");
});
