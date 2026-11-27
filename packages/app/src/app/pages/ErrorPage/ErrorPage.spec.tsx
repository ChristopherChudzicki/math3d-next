import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { MockInstance } from "vitest";
import * as Sentry from "@sentry/react";
import { renderTestApp, screen } from "@/test_util";
import { normalizeError } from "./ErrorPage";
import copy from "./errorPage.copy";

// Silence what React and the router log for a caught render error (the router
// warns, in development). File-scoped so restoration survives an assertion
// throwing mid-test.
let consoleError: MockInstance<typeof console.error>;
let consoleWarn: MockInstance<typeof console.warn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe("ErrorPage as the root route's errorComponent", () => {
  test("renders the branded fallback when a route throws", async () => {
    await renderTestApp("/?test-sync-error=kaboom");
    expect(
      await screen.findByRole("heading", { name: copy.title }),
    ).toBeVisible();
    expect(screen.getByText(/kaboom/)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  test("reports the error to Sentry once", async () => {
    await renderTestApp("/?test-sync-error=kaboom");
    await screen.findByRole("heading", { name: copy.title });
    expect(Sentry.captureException).toHaveBeenCalledOnce();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "kaboom" }),
      {
        mechanism: { type: "tanstack-router.errorComponent", handled: false },
      },
    );
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

  test("uses a plain object's message when present", () => {
    expect(normalizeError({ message: "non-Error throwable" })).toEqual({
      message: "non-Error throwable",
    });
  });
});
