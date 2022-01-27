import { MathNode, SymbolNode } from "mathjs";

export const getDependencies = (node: MathNode): Set<string> => {
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (n instanceof SymbolNode) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};
