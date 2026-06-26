import { describe, test, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import Ajv, { type AnySchemaObject } from "ajv";

import { mathItemConfigs as configs, MathItemType as MIT } from "./index";

const loadSpec = () => {
  const filepath = path.join(__dirname, "../../../webserver/openapi.v1.yaml");
  return yaml.load(fs.readFileSync(filepath, "utf8")) as {
    components: { schemas: Record<string, AnySchemaObject> };
  };
};

const spec = loadSpec();
const { schemas } = spec.components;

// The math-item union schema: the named `MathItem` component (a oneOf over the
// 16 item types). Scene schemas reference it via `$ref`.
const itemSchema = schemas.MathItem as AnySchemaObject;

const ajv = new Ajv({ strict: false, allErrors: true });
// Register every component schema so internal $refs resolve.
Object.entries(schemas).forEach(([name, schema]) => {
  ajv.addSchema(schema, `#/components/schemas/${name}`);
});
const validate = ajv.compile(itemSchema);

const types = Object.values(MIT);

test("items did not collapse: union has 16 branches", () => {
  // discriminator is an OpenAPI keyword ajv ignores under strict:false; the
  // raw oneOf + per-branch additionalProperties:false carries type-matching.
  expect(Array.isArray(itemSchema.oneOf)).toBe(true);
  expect(itemSchema.oneOf).toHaveLength(16);
});

test("All configs are tested", () => {
  expect(new Set(types)).toEqual(new Set(Object.values(MIT)));
});

describe.each(types)("Schema validation for %s", (type) => {
  test("happy path", () => {
    const item = configs[type].make("fake-id");
    expect(validate(item)).toBe(true);
  });

  test("Extra properties rejected", () => {
    const item = configs[type].make("fake-id");
    expect(validate(item)).toBe(true);
    expect(
      validate({ ...item, properties: { ...item.properties, cat: "meow" } }),
    ).toBe(false);
  });

  test("Bad property rejected", () => {
    const item = configs[type].make("fake-id");
    expect(validate(item)).toBe(true);

    const bad = configs[type].make("fake-id");
    // @ts-expect-error description is typed string; an object is a deliberate type error to check runtime validation.
    bad.properties.description = {};
    expect(validate(bad)).toBe(false);
  });
});
