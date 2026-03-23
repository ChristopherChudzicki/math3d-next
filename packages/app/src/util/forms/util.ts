import { FieldPath } from "react-hook-form";
import type { UseFormSetError, FieldValues } from "react-hook-form";
import { isAxiosError } from "@math3d/api";

/**
 * allauth error format:
 *   { status: 400, errors: [{ code, message, param? }] }
 */
interface AllAuthErrorItem {
  code: string;
  message: string;
  param?: string;
}

const isAllAuthErrorResponse = (
  data: unknown,
): data is { status: number; errors: AllAuthErrorItem[] } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "errors" in data &&
    Array.isArray((data as { errors: unknown }).errors)
  );
};

/**
 * Error handler for use with react-hooks-forms. Handles both allauth and DRF
 * error response formats:
 *
 * - allauth: `{ status: 400, errors: [{ code, message, param? }] }`
 * - DRF: `Record<FieldName | "non_field_errors", string[]>`
 *
 * Maps field-level errors to individual fields and non-field errors to "root".
 * Other errors display an overall message "Something went wrong...".
 */
const setFieldErrors = <TFieldValues extends FieldValues>(
  data: TFieldValues,
  err: unknown,
  setError: UseFormSetError<TFieldValues>,
) => {
  let hasSetErrors = false;

  if (isAxiosError(err, [400, 409])) {
    const errData = err.response?.data;

    // allauth error format
    if (isAllAuthErrorResponse(errData)) {
      errData.errors.forEach((error) => {
        if (error.param && error.param in data) {
          setError(error.param as FieldPath<TFieldValues>, {
            type: "400",
            message: error.message,
          });
          hasSetErrors = true;
        } else if (!error.param) {
          setError("root", {
            type: "400",
            message: error.message,
          });
          hasSetErrors = true;
        }
      });
      if (!hasSetErrors) {
        const firstError = errData.errors[0];
        if (firstError) {
          setError("root", {
            type: "400",
            message: firstError.message,
          });
          hasSetErrors = true;
        }
      }
    } else {
      // DRF error format
      const drfData = errData as Record<string, string[]>;
      Object.keys(data).forEach((key) => {
        const fieldErrors = drfData[key];
        if (fieldErrors) {
          setError(key as FieldPath<TFieldValues>, {
            type: "400",
            message: fieldErrors[0],
          });
          hasSetErrors = true;
        }
      });
      if (drfData.non_field_errors) {
        setError("root", {
          type: "400",
          message: drfData.non_field_errors[0],
        });
        hasSetErrors = true;
      }
    }
  }

  if (hasSetErrors) return true;
  setError("root", {
    message: "Something went wrong. Please try again later.",
  });
  throw err;
};

export { setFieldErrors };
