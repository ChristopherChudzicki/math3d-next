import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import type {
  UseFormProps,
  UseFormReturn,
  FieldValues,
  Resolver,
  UseFormHandleSubmit,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";
import type React from "react";
import { useCallback } from "react";
import * as Sentry from "@sentry/react";
import { isApiFailure } from "@math3d/api";
import { failureMessage } from "@/util/failureCopy";

/**
 * A wrapper around `react-hook-form`'s `useForm` that:
 *  1. requires a yup schema for client-side validation
 *  2. turns a rejected submit into a "root" error, and reports it to Sentry
 *     unless it's an API failure, which the mutation cache reports
 *
 * There is no per-field mapping: v1 rejects a bad body as ninja's
 * `{"detail": [...]}`, which names no field, and both consumers are
 * single-field forms anyway.
 */
const useValidatedForm = <TFieldValues extends FieldValues = FieldValues>(
  props: Omit<UseFormProps<TFieldValues>, "resolver"> & {
    schema: yup.ObjectSchema<TFieldValues>;
  },
): UseFormReturn<TFieldValues> => {
  // @ts-expect-error This is resolver<MakeKeysOptional<TFieldValues>>
  // for some reason
  const resolver: Resolver<TFieldValues> = yupResolver(props.schema);
  const {
    handleSubmit: rawHandleSubmit,
    setError,
    ...others
  } = useForm<TFieldValues>({
    resolver,
    ...props,
  });
  const handleSubmit: UseFormHandleSubmit<TFieldValues> = useCallback(
    <TResult>(
      rawOnValid: SubmitHandler<TFieldValues, TResult>,
      onInvalid?: SubmitErrorHandler<TFieldValues>,
    ) => {
      const onValid = async (
        data: TFieldValues,
        event?: React.BaseSyntheticEvent,
      ): Promise<Awaited<TResult> | undefined> => {
        try {
          const result = await rawOnValid(data, event);
          return result;
        } catch (err) {
          setError("root", { message: failureMessage(err) });
          // Nothing awaits this handler, so rethrowing would reach Sentry only
          // as an unhandled rejection.
          if (!isApiFailure(err)) Sentry.captureException(err);
          return undefined;
        }
      };
      return rawHandleSubmit(onValid, onInvalid);
    },
    [rawHandleSubmit, setError],
  );

  return {
    handleSubmit,
    setError,
    ...others,
  };
};

export { useValidatedForm };
