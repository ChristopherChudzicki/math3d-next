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
import { setFieldErrors } from "./util";

/**
 * A wrapper around `react-hook-form`'s `useForm` that:
 *  1. requires a yup schema for client-side validation
 *  2. maps the v1 and allauth error bodies onto form fields (see setFieldErrors)
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
          try {
            setFieldErrors(data, err, setError);
          } catch (unmapped) {
            // setFieldErrors rethrows what it could not map to a field, having
            // already set a generic "root" message for the user. Report it here:
            // nothing awaits this handler, so rethrowing would only reach Sentry
            // as an unhandled rejection.
            Sentry.captureException(unmapped);
          }
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
