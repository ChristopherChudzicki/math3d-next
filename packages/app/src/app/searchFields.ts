import { controlsSearchFields } from "@/app/pages/MainPage/search";
import { errorTriggerSearchFields } from "@/app/pages/ErrorPage/ErrorTrigger";
import { signInErrorSearchFields } from "@/features/auth/search";
import { viewportSearchFields } from "@/features/viewport/search";
import { overlaySearchFields } from "@/services/overlays/search";

/** The search params every route shares; each owner declares its own. */
export const rootSearchFields = {
  ...overlaySearchFields,
  ...viewportSearchFields,
  ...controlsSearchFields,
  ...signInErrorSearchFields,
  ...errorTriggerSearchFields,
};
