import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { screen, waitFor } from "@/test_util";
import ErrorPage, { normalizeError } from "./ErrorPage";
import copy from "./errorPage.copy";

const Boom: React.FC = () => {
  throw new Error("Cannot read properties of undefined (reading 'type')");
};

describe("ErrorPage as a route errorElement", () => {
  test("renders the branded fallback when a route throws", async () => {
    // React + React Router log the caught render error; that's expected here.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
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
    consoleError.mockRestore();
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
