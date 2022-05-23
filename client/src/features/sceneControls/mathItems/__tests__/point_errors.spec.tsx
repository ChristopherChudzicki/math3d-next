import { MathItemType as MIT } from "configs";
import {
  IntegrationTest,
  user,
  screen,
  makeItem,
  nodeId,
  typeText,
} from "test_util";

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [1, 2, 3],
    numParseErrors: 0,
    numEvalErrors: 0,
  },
  {
    coordsString: "[1, 2, 3",
    coords: undefined,
    numParseErrors: 1,
    numEvalErrors: 0,
  },
  {
    coordsString: "2^[1, 2, 3]",
    coords: undefined,
    numParseErrors: 0,
    numEvalErrors: 1,
  },
])(
  "initial coords evaluation/errors are correct",
  ({ coordsString, coords, numParseErrors, numEvalErrors }) => {
    const point = makeItem(MIT.Point, { coords: coordsString });
    const id = nodeId(point);
    const helper = new IntegrationTest();
    helper.patchMathItems([point]);
    const { mathScope } = helper.render();

    expect(mathScope.evalErrors.size).toBe(numEvalErrors);
    expect(mathScope.parseErrors.size).toBe(numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  }
);

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [1, 2, 3],
    numParseErrors: 0,
    numEvalErrors: 0,
  },
  {
    coordsString: "[1, 2, 3",
    coords: undefined,
    numParseErrors: 1,
    numEvalErrors: 0,
  },
  {
    coordsString: "2^[1, 2, 3]",
    coords: undefined,
    numParseErrors: 0,
    numEvalErrors: 1,
  },
])(
  "coords evaluation/errors update on text change; text='$coordsString'",
  async ({ coords, coordsString, numEvalErrors, numParseErrors }) => {
    const point = makeItem(MIT.Point);
    const id = nodeId(point);
    const helper = new IntegrationTest();
    helper.patchMathItems([point]);
    const { mathScope } = helper.render();

    const coordsInput = await screen.findByTitle("Coordinates");
    user.clear(coordsInput);
    await typeText(coordsInput, coordsString);
    expect(mathScope.evalErrors.size).toBe(numEvalErrors);
    expect(mathScope.parseErrors.size).toBe(numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  }
);
