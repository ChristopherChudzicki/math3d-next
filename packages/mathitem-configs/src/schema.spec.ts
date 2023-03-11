import { faker } from "@faker-js/faker";
import { describe, test, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import Ajv from "ajv/dist/jtd";

import { mathItemConfigs as configs, MathItemType as MIT } from "./index";

const ajv = new Ajv();

const getSchema = () => {
  const filepath = path.join(__dirname, "./schema.jtd.yaml");
  const doc = yaml.load(fs.readFileSync(filepath, "utf8"));
  return doc as Record<string, unknown>;
};
const schema = getSchema();

const types = [
  MIT.Axis,
  MIT.BooleanVariable,
  MIT.Camera,
  MIT.ExplicitSurface,
  MIT.ExplicitSurfacePolar,
  MIT.Folder,
  MIT.Grid,
  MIT.ImplicitSurface,
  MIT.Line,
  MIT.ParametricCurve,
  MIT.ParametricSurface,
  MIT.Point,
  MIT.Variable,
  MIT.VariableSlider,
  MIT.Vector,
  MIT.VectorField,
];

test("All configs are tested", () => {
  expect(new Set(types)).toEqual(new Set(Object.values(MIT)));
});

test("schema compiles", () => {
  ajv.compile(schema);
});

describe.each(types)("Schema validation for %s", (type) => {
  test("happy path", () => {
    const validate = ajv.compile(schema);

    const item = configs[type].make("fake-id");

    const isValid = validate([item]);
    expect(validate.errors).toBe(null);
    expect(isValid).toBe(true); // should be redundant, but ok
  });

  test("Extra properties", () => {
    const validate = ajv.compile(schema);

    const item = configs[type].make("fake-id");
    expect(validate([item])).toBe(true);
    expect(validate([{ ...item, cat: "meow" }])).toBe(false);
  });

  test("Bad properties", () => {
    const validate = ajv.compile(schema);
    const item = configs[type].make("fake-id");

    expect(validate([item])).toBe(true);

    const key = faker.helpers.arrayElement(Object.keys(item.properties));
    // @ts-expect-error making bad data on purpose
    item.properties[key] = {};

    expect(validate([item])).toBe(false);
  });
});
