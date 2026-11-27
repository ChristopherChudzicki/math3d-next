import React, { useState } from "react";
import type { Decorator } from "@storybook/react-vite";
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

const StoryRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [router] = useState(() =>
    createRouter({
      routeTree: createRootRoute(),
      history: createMemoryHistory(),
    }),
  );
  return (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  );
};

/**
 * Gives every story a router for links to resolve against. No route matches,
 * so a story of a component that reads the URL would throw.
 */
const withRouter: Decorator = (Story) => (
  <StoryRouter>
    <Story />
  </StoryRouter>
);

export default withRouter;
