import { MathItemType as MIT } from "configs";
import { IntegrationTest, user, screen, makeItem } from "test_util";

test("woofs", () => {
  const helper = new IntegrationTest();
  helper.patchMathItems([makeItem(MIT.Point)]);
  const { mathScope } = helper.render();
  console.log(mathScope.results);
});
