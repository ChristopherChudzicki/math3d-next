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
} from "react-hook-form";
import { useCallback } from "react";
import * as Sentry from "@sentry/react";

/**
 * A wrapper around `react-hook-form`'s `useForm` that:
 *  1. requires a yup schema for client-side validation
 *  2. turns a rejected submit into a "root" error plus a Sentry event
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
    (rawOnValid, onInvalid) => {
      const onValid: SubmitHandler<TFieldValues> = async (data, event) => {
        try {
          await rawOnValid(data, event);
        } catch (err) {
          setError("root", {
            message: "Something went wrong. Please try again later.",
          });
          // Nothing awaits this handler, so rethrowing would reach Sentry only
          // as an unhandled rejection.
          Sentry.captureException(err);
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
