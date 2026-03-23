import { FieldPath } from "react-hook-form";
import type { UseFormSetError, FieldValues } from "react-hook-form";
import { isAxiosError } from "@math3d/api";

/**
 * allauth error format:
 *   { status: 400, errors: [{ code, message, param? }] }
 *
 * DRF error format (for custom endpoints like users/me):
 *   { field: ["error message"], non_field_errors: ["..."] }
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
 * Error handler for use with react-hook-form. Handles both allauth and DRF
 * error response formats.
 */
const handleErrors = <TFieldValues extends FieldValues>(
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
      // If there are param errors that don't match form fields, show as root
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
      // DRF error format: Record<field, string[]>
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

export { handleErrors };
