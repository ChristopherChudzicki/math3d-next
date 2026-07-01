import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor } from "@/test_util";
import { faker } from "@faker-js/faker/locale/en";
import { urls } from "@math3d/mock-api";
import { mockResponseOnce } from "@math3d/mock-api/node";

test("activation opens as an overlay from the email link", async () => {
  await renderTestApp(`/?overlay=activate&key=${faker.string.uuid()}`);
  expect(
    await screen.findByRole("dialog", { name: "Account Activation" }),
  ).toBeVisible();
});

test("Authorization form happy path: API call, success indication, & log in", async () => {
  const { location } = await renderTestApp(
    `/?overlay=activate&key=${faker.string.uuid()}`,
  );
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/activated/);
  expect(screen.getByRole("link", { name: "log in" })).toHaveAttribute(
    "href",
    "/?overlay=login",
  );
  const button = screen.getByRole("button", { name: "Go to login" });
  await user.click(button);
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=login"),
  );
  expect(location.current.pathname).toBe("/");
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
  await renderTestApp(`/?overlay=activate&key=${faker.string.uuid()}`);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/activation link/);
});
