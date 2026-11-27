import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/test_util/routerTesting";
import Anchor from "./Anchor";

test("a link home isn't marked current on another page", async () => {
  // The router counts `/` as active on every page.
  await renderWithRouter(
    <Anchor to="/{-$sceneKey}" params={{ sceneKey: undefined }}>
      Home
    </Anchor>,
    { url: "/abc" },
  );

  const link = screen.getByRole("link", { name: "Home" });
  expect(link).toHaveAttribute("href", "/");
  expect(link).not.toHaveAttribute("aria-current");
});
