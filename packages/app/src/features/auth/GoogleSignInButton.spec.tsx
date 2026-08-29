/* eslint-disable testing-library/no-node-access -- the gsi/client script is
   injected into document.head, outside any container a testing-library query
   can reach. */
import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { mockGoogleIdentity } from "@/test_util";
import GoogleSignInButton from "./GoogleSignInButton";

afterEach(() => {
  delete window.google;
  document
    .querySelectorAll('script[src^="https://accounts.google.com"]')
    .forEach((el) => el.remove());
});

test("initializes Google with the configured client ID and renders into its own container", async () => {
  const gsi = mockGoogleIdentity();
  const view = render(<GoogleSignInButton onCredential={vi.fn()} />);

  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  expect(gsi.initialize.mock.calls[0][0].client_id).toBe(
    "test-client-id.apps.googleusercontent.com",
  );
  expect(gsi.renderButton.mock.calls[0][0]).toBe(view.container.firstChild);
});

test("forwards the credential Google returns", async () => {
  const gsi = mockGoogleIdentity();
  const onCredential = vi.fn();
  render(<GoogleSignInButton onCredential={onCredential} />);

  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  gsi.fireCredential("a-credential");
  expect(onCredential).toHaveBeenCalledWith("a-credential");
});

test("shows an error instead of a dead button when the script cannot load", async () => {
  render(<GoogleSignInButton onCredential={vi.fn()} />);

  const script = await waitFor(() => {
    const el = document.querySelector(
      'script[src^="https://accounts.google.com"]',
    );
    if (!el) throw new Error("The gsi/client script was not injected.");
    return el;
  });
  await act(async () => {
    script.dispatchEvent(new Event("error"));
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(/Google sign-in/i);
});
