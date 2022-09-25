import { validators } from "@/util";

export * from "./configs";
export * from "./predicates";
export type { IMathItemConfig, PropertyConfig } from "./interfaces";

window.validators = validators;
