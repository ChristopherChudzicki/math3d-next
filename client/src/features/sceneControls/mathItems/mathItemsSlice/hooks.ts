import { useAppSelector } from "@/store/hooks";
import MathScope from "@/util/MathScope";
import * as select from "./selectors";

const useMathScope = (): MathScope => {
  return useAppSelector(select.mathScope());
};

export { useMathScope };
