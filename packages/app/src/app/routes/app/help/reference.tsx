import { createFileRoute } from "@tanstack/react-router";
import HelpPage from "@/app/pages/HelpPage/HelpPage";

export const Route = createFileRoute("/app/help/reference")({
  component: HelpPage,
});
