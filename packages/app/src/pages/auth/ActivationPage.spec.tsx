import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor } from "@/test_util";
import { faker } from "@faker-js/faker/locale/en";
import { urls } from "@math3d/mock-api";
import { mockResponseOnce } from "@math3d/mock-api/node";

test("activation page loads at the exact email-link path", async () => {
  await renderTestApp(`/app/auth/activate-account?key=${faker.string.uuid()}`);
  expect(
    await screen.findByRole("heading", { name: "Account Activation" }),
  ).toBeVisible();
});

test("Authorization form happy path: API call, success indication, & log in", async () => {
  const { location } = await renderTestApp(
    `/app/auth/activate-account?key=${faker.string.uuid()}`,
  );
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/activated/);
  expect(screen.getByRole("link", { name: "log in" })).toHaveAttribute(
    "href",
    "/?overlay=login",
  );
  const button = screen.getByRole("button", { name: "Go to login" });
  await user.click(button);
  await waitFor(() => expect(location.current.pathname).toBe("/"));
  expect(location.current.search).toContain("overlay=login");
});

test("Error message for invalid key", async () => {
  mockResponseOnce({
    status: 400,
    url: urls.auth.verifyEmail,
    method: "post",
    data: {
      status: 400,
      errors: [
        {
          code: "invalid",
          message: "Invalid or expired key.",
          param: "key",
        },
      ],
    },
  });
  await renderTestApp(`/app/auth/activate-account?key=${faker.string.uuid()}`);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/activation link/);
});
