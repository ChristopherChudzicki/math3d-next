import { createRootRoute } from "@tanstack/react-router";
import RootLayout from "@/app/RootLayout";
import ErrorPage, { reportRenderError } from "@/app/pages/ErrorPage/ErrorPage";
import NotFoundPage from "@/app/pages/NotFound/NotFoundPage";
import { rootSearchFields } from "@/app/searchFields";
import { lenientSearch } from "@/util/lenientSearch";

export const Route = createRootRoute({
  validateSearch: lenientSearch(rootSearchFields),
  component: RootLayout,
  // Also catches throws from RootLayout itself.
  errorComponent: ErrorPage,
  onCatch: reportRenderError,
  notFoundComponent: NotFoundPage,
});
