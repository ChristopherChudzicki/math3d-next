import * as R from "ramda";
import { MathNode } from "mathjs";
import toposort from "toposort";
import type { GeneralAssignmentNode } from "./types";
import { isGeneralAssignmentNode, getDependencies } from "./util";
import DirectedGraph from "./DirectedGraph";

const getAssignmentNodesByName = R.pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  { [name: string]: GeneralAssignmentNode[] }
>(R.filter(isGeneralAssignmentNode), R.groupBy(R.prop("name")));

export default class ExpressionGraph {
  graph = new DirectedGraph<MathNode>([], []);

  addExpressions(nodes: MathNode[]): void {
    nodes.forEach((node) => {
      this.graph.addNode(node);
    });
    const assignments = getAssignmentNodesByName(
      Array.from(this.graph.getNodes())
    );
    nodes.forEach((dependent) => {
      const dependencyNames = getDependencies(dependent);
      dependencyNames.forEach((dependencyName) => {
        // Variable names might be multiply assigned (a = 2 and a = 3) so each
        // name might be multiple nodes
        const dependencies = assignments[dependencyName];
        dependencies.forEach((dependency) => {
          this.graph.addEdge(dependency, dependent);
        });
      });
    });
  }

  removeExpressions(nodes: MathNode[]): void {
    nodes.forEach((node) => this.graph.deleteNode(node));
  }
}
