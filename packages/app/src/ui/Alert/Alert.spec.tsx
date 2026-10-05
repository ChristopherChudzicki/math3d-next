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

test("announce={false} renders no live region", () => {
  render(
    <Alert severity="error" announce={false}>
      Message
    </Alert>,
  );

  expect(screen.getByText("Message")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
