import React, { createContext, useContext, useState } from "react";
import type { Decorator } from "@storybook/react-vite";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

// The router (and its route's component) is created once, so the story arrives
// through context to pick up new args.
const StoryContext = createContext<React.ReactNode>(null);
const StoryOutlet: React.FC = () => <>{useContext(StoryContext)}</>;

const StoryRouter: React.FC<{ story: React.ReactNode }> = ({ story }) => {
  const [router] = useState(() =>
    createRouter({
      routeTree: createRootRoute({ component: StoryOutlet }),
      history: createMemoryHistory(),
    }),
  );
  return (
    <StoryContext.Provider value={story}>
      <RouterProvider router={router} />
    </StoryContext.Provider>
  );
};

/** Renders every story under a router, so links have one to resolve against. */
const withRouter: Decorator = (Story) => <StoryRouter story={<Story />} />;

export default withRouter;
