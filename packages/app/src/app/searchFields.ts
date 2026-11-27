import { errorTriggerSearchFields } from "@/app/pages/ErrorPage/ErrorTrigger";
import { signInErrorSearchFields } from "@/features/auth/search";
import { viewportSearchFields } from "@/features/viewport/search";
import { overlaySearchFields } from "@/services/overlays/search";
import { rendererSearchFields } from "@/services/renderer/search";

/** The search params every route shares; each owner declares its own. */
export const rootSearchFields = {
  ...overlaySearchFields,
  ...viewportSearchFields,
  ...signInErrorSearchFields,
  ...errorTriggerSearchFields,
  ...rendererSearchFields,
};
