import { FieldPath } from "react-hook-form";
import type { UseFormSetError, FieldValues } from "react-hook-form";
import { isAxiosError } from "@math3d/api";

/**
 * Error handler for use with react-hooks-forms. If an API error is:
 * 1. an AxiosError instance,
 * 2. AND has status code 400
 * 3. AND has a response of shape Record<FieldName | "non_field_errors", string[]>
 *
 * then sets errors on the individual fields (for FieldName) or an overall error
 * (for "non_field_errors").
 *
 * Other errors display an overall message "Unknown error".
 *
 * The error object shape is compatible with errors thrown by DRF serializers.
 */
const handleErrors = <TFieldValues extends FieldValues>(
  data: TFieldValues,
  err: unknown,
  setError: UseFormSetError<TFieldValues>,
) => {
  let hasSetErrors = false;
  if (isAxiosError(err, [400])) {
    const errData = err.response?.data as Record<string, string[]>;
    Object.keys(data).forEach((key) => {
      const fieldErrors = errData[key];
      if (fieldErrors) {
        setError(key as FieldPath<TFieldValues>, {
          type: "400",
          message: fieldErrors[0],
        });
        hasSetErrors = true;
      }
    });
    if (errData.non_field_errors) {
      setError("root", {
        type: "400",
        message: errData.non_field_errors[0],
      });
      hasSetErrors = true;
    }
  }
  if (hasSetErrors) return true;
  setError("root", { message: "Unknown error" });
  throw err;
};

export { handleErrors };
