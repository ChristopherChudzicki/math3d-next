import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { MockInstance } from "vitest";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import * as Sentry from "@sentry/react";
import { screen, waitFor } from "@/test_util";
import ErrorPage, { normalizeError } from "./ErrorPage";
import copy from "./errorPage.copy";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

const Boom: React.FC = () => {
  throw new Error("Cannot read properties of undefined (reading 'type')");
};

// Silence the console.error React and React Router emit for caught render
// errors. File-scoped so restoration survives an assertion throwing mid-test.
let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("ErrorPage as a route errorElement", () => {
  test("renders the branded fallback when a route throws", async () => {
    const router = createMemoryRouter([
      { path: "/", element: <Boom />, errorElement: <ErrorPage /> },
    ]);
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: copy.title })).toBeVisible();
    });
    expect(
      screen.getByText(/Cannot read properties of undefined/),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});

describe("Sentry reporting", () => {
  test("reports a thrown render error", async () => {
    const router = createMemoryRouter([
      { path: "/", element: <Boom />, errorElement: <ErrorPage /> },
    ]);
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cannot read properties of undefined (reading 'type')",
        }),
        // Unhandled: the error took the user to the fallback page.
        { mechanism: { type: "react-router.errorElement", handled: false } },
      );
    });
  });

  test("does not report a route error response", async () => {
    // A 404 from the router is an HTTP response, not an exception.
    const router = createMemoryRouter(
      [{ path: "/", element: <div>home</div>, errorElement: <ErrorPage /> }],
      { initialEntries: ["/nope"] },
    );
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: copy.title })).toBeVisible();
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe("normalizeError", () => {
  test("extracts message and stack from an Error", () => {
    const err = new Error("kaboom");
    expect(normalizeError(err)).toMatchObject({
      message: "kaboom",
      stack: expect.stringContaining("kaboom"),
    });
  });

  test("uses a string error directly", () => {
    expect(normalizeError("plain string failure")).toEqual({
      message: "plain string failure",
    });
  });

  test("falls back to a generic message for unknown throwables", () => {
    expect(normalizeError(null)).toEqual({ message: copy.unknownError });
    expect(normalizeError({})).toEqual({ message: copy.unknownError });
  });

  test("formats a route error response as status + statusText", () => {
    const routeError = {
      status: 404,
      statusText: "Not Found",
      internal: false,
      data: undefined,
    };
    expect(normalizeError(routeError)).toEqual({ message: "404 Not Found" });
  });

  test("surfaces a route error response's string data as detail", () => {
    const routeError = {
      status: 422,
      statusText: "Unprocessable",
      internal: false,
      data: "Scene payload failed validation",
    };
    expect(normalizeError(routeError)).toEqual({
      message: "422 Unprocessable",
      stack: "Scene payload failed validation",
    });
  });

  test("uses a plain object's message when present", () => {
    expect(normalizeError({ message: "non-Error throwable" })).toEqual({
      message: "non-Error throwable",
    });
  });
});
