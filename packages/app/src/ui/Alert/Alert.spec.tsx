import React from "react";
import { render, screen } from "@testing-library/react";
import Alert from "./Alert";
import type { AlertSeverity } from "./Alert";

test.each<[AlertSeverity, "alert" | "status"]>([
  ["error", "alert"],
  ["warning", "status"],
])("a %s alert has role %s by default", (severity, role) => {
  render(<Alert severity={severity}>Message</Alert>);

  expect(screen.getByRole(role)).toHaveTextContent("Message");
});

test("role can be overridden", () => {
  render(
    <Alert severity="error" role="status">
      Message
    </Alert>,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Message");
});
