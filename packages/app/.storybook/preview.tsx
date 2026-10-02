import "../src/globals.css";
import "./preview.css";
import React from "react";
import type { Preview } from "@storybook/react-vite";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import { theme } from "../src/mui";

const preview: Preview = {
  decorators: [
    // Match AppProviders so MUI-based components render as they do in the app.
    (Story) => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
      </StyledEngineProvider>
    ),
  ],
};

export default preview;
