import { mixed } from "yup";

/** `?controls=0` hides the controls sidebar. */
export const controlsSearchFields = {
  controls: mixed<0 | 1>().oneOf([0, 1]),
};
