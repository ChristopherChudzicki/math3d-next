import type { AnySchema, InferType } from "yup";

type SearchFields = Record<string, AnySchema>;

type LenientSearch<F extends SearchFields> = {
  [K in keyof F]?: InferType<F[K]>;
};

/**
 * A route's `validateSearch` that never throws: each field is validated on its
 * own, and a bad value is logged and dropped, so the reader's default applies.
 */
const lenientSearch =
  <F extends SearchFields>(fields: F) =>
  (raw: Record<string, unknown>): LenientSearch<F> => {
    const out: Record<string, unknown> = {};
    Object.entries(fields).forEach(([name, field]) => {
      if (!(name in raw)) return;
      try {
        out[name] = field.validateSync(raw[name]);
      } catch {
        // The router spreads the raw search under this result, so a dropped
        // field must be overwritten, not omitted.
        out[name] = undefined;
        // eslint-disable-next-line no-console
        console.error(
          `Invalid value ${JSON.stringify(raw[name])} for search parameter ${name}`,
        );
      }
    });
    return out as LenientSearch<F>;
  };

export { lenientSearch };
