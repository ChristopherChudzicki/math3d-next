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
import { setFieldErrors } from "./util";

/**
 * A wrapper around `react-hook-form`'s `useForm` that:
 *  1. requires a yup scehma for client-side validation
 *  2. handles DRF error responses for server-side errors
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
          setFieldErrors(data, err, setError);
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
