import { createFileRoute } from "@tanstack/react-router";
import SignInErrorPage from "@/app/pages/auth/SignInErrorPage";

export const Route = createFileRoute("/app/sign-in-error")({
  component: SignInErrorPage,
});
