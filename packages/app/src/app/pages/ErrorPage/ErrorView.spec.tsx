import React from "react";
import { describe, test, expect, vi, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { screen, user, within } from "@/test_util";
import ErrorView from "./ErrorView";
import copy from "./errorPage.copy";

describe("ErrorView", () => {
  test("shows the branded headline and reassurance copy", () => {
    render(<ErrorView />);
    expect(screen.getByRole("heading", { name: copy.title })).toBeVisible();
    expect(screen.getByText(copy.eyebrow)).toBeVisible();
    expect(screen.getByText(copy.body)).toBeVisible();
  });

  test("announces the error via an alert region containing the explanation", () => {
    render(<ErrorView />);
    const alert = screen.getByRole("alert");
    // the explanation, not just the pun, must be inside the live region
    expect(within(alert).getByText(copy.body)).toBeInTheDocument();
  });

  test("the primary action invokes onReload", async () => {
    const onReload = vi.fn();
    render(<ErrorView onReload={onReload} />);
    await user.click(screen.getByRole("button", { name: copy.reload }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  test("'Back to home' is a real navigation to the home href", () => {
    render(<ErrorView />);
    expect(screen.getByRole("link", { name: copy.home })).toHaveAttribute(
      "href",
      copy.homeHref,
    );
  });

  test("moves focus to the error message on mount", () => {
    render(<ErrorView />);
    expect(screen.getByRole("alert")).toHaveFocus();
  });

  test("'Report this bug' opens the report URL in a new tab", () => {
    render(<ErrorView reportHref="https://example.com/new-issue" />);
    const link = screen.getByRole("link", { name: new RegExp(copy.report) });
    expect(link).toHaveAttribute("href", "https://example.com/new-issue");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  test("prefills a new-issue report link with the error when no href is given", () => {
    render(<ErrorView message="Boom kaboom" />);
    const href = screen
      .getByRole("link", { name: new RegExp(copy.report) })
      .getAttribute("href");
    const url = new URL(href ?? "");
    expect(url.pathname).toMatch(/\/new$/);
    expect(url.searchParams.get("title")).toContain("Boom kaboom");
  });

  test("includes the broken-torus graphic", () => {
    render(<ErrorView />);
    expect(screen.getByTestId("broken-torus")).toBeInTheDocument();
  });
});

describe("ErrorView technical details", () => {
  beforeAll(() => {
    Object.assign(window.navigator, { clipboard: { writeText: vi.fn() } });
  });
  afterAll(() => {
    // @ts-expect-error removing the fake clipboard
    delete window.navigator.clipboard;
  });

  test("shows the message and stack behind a disclosure", () => {
    render(<ErrorView message="Boom" stack="at foo (bar.js:1:2)" />);
    expect(screen.getByText(copy.detailsSummary)).toBeInTheDocument();
    expect(screen.getByText(/at foo \(bar\.js:1:2\)/)).toBeInTheDocument();
  });

  test("copies the full details and confirms only after success", async () => {
    render(<ErrorView message="Boom" stack="at foo (bar.js:1:2)" />);
    await user.click(screen.getByRole("button", { name: copy.copy }));
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Boom\n\nat foo (bar.js:1:2)",
    );
    // confirmation is async (awaits the clipboard write resolving)
    expect(
      await screen.findByRole("button", { name: copy.copied }),
    ).toBeInTheDocument();
  });

  test("omits the disclosure when there is no error text", () => {
    render(<ErrorView />);
    expect(screen.queryByText(copy.detailsSummary)).not.toBeInTheDocument();
  });
});
