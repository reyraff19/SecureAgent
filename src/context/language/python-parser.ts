import Parser = require("tree-sitter");
import Python = require("tree-sitter-python");
import { AbstractParser, EnclosingContext } from "../../constants";

const processNode = (
  node: any,
  lineStart: number,
  lineEnd: number,
  largestSize: number,
  largestEnclosingContext: any
) => {
  const startLine = node.startPosition.row + 1;
  const endLine = node.endPosition.row + 1;

  if (startLine <= lineStart && lineEnd <= endLine) {
    const size = endLine - startLine;
    if (size > largestSize) {
      largestSize = size;
      largestEnclosingContext = node;
    }
  }
  return { largestSize, largestEnclosingContext };
};
export class PythonParser implements AbstractParser {
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext {
    const parser = new Parser();
    parser.setLanguage(Python);

    const tree = parser.parse(file);

    let largestEnclosingContext = null;
    let largestSize = 0;

    // Recursive function to traverse the AST
    const traverseTree = (node: any) => {
      const nodeType = node.type;

      // Check if the node is relevant for finding an enclosing context
      if (
        nodeType === "function_definition" || // Functions
        nodeType === "class_definition" || // Classes
        nodeType === "block" // General blocks
      ) {
        ({ largestSize, largestEnclosingContext } = processNode(
          node,
          lineStart,
          lineEnd,
          largestSize,
          largestEnclosingContext
        ));
      }

      // Traverse child nodes
      for (const child of node.children) {
        traverseTree(child);
      }
    };

    // Start traversing the AST
    traverseTree(tree.rootNode);

    return { enclosingContext: largestEnclosingContext } as EnclosingContext;
  }
  dryRun(file: string): { valid: boolean; error: string } {
    try {
      const parser = new Parser();
      parser.setLanguage(Python);

      // Try parsing the file
      parser.parse(file);
      return { valid: true, error: "" };
    } catch (error) {
      return { valid: false, error: "Not implemented yet" };
    }
  }
}
