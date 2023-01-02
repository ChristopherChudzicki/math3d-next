import { useAppSelector } from "@/store/hooks";
import type { AppMathScope } from "./interfaces";
import * as select from "./selectors";

const useMathScope = (): AppMathScope => {
  return useAppSelector(select.mathScope());
};

export { useMathScope };
