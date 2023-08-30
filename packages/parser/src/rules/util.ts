import escapeRegExp from "lodash/escapeRegExp";

interface SubstringRange {
  start: number;
  end: number;
}

/**
 * Find the next balanced instance of opener...closer in text starting at the
 * specified index within text.
 *
 * @example
 * ```
 *            // 0         1         2         3         4
 *            // 01234567890123456789012345678901234567890123456789
 * const text = "hello [ b [ ] ] world [ [ ] [ ] ] bye"
 * const startingFrom = 16
 * const range = findNestedExpression(text, "[", "]", startingFrom)
 * expect(range).toEqual({ start: 22, end: 33 })
 * ```
 */
const findNestedExpression = (
  text: string,
  opener: string,
  closer: string,
  startingFrom = 0,
  escapeChar = "\\"
): SubstringRange | null => {
  const start = text.indexOf(opener, startingFrom);
  if (start < 0) return null;
  let scanningIndex = start + opener.length;
  let numOpen = 1;
  const regex = new RegExp(
    String.raw`(?<!${escapeRegExp(escapeChar)})(?<delimiter>${escapeRegExp(
      opener
    )}|${escapeRegExp(closer)})`
  );
  while (numOpen > 0) {
    const nextDelimiter = text.substring(scanningIndex).match(regex);
    if (nextDelimiter === null) return null;
    if (nextDelimiter[0] === opener) {
      numOpen += 1;
    }
    if (nextDelimiter[0] === closer) {
      numOpen -= 1;
    }
    // The index will never be null since the regexp has matched and is not global.
    if (nextDelimiter.index === undefined) {
      throw new Error("Unexpected undefined index");
    }
    scanningIndex += nextDelimiter.index + nextDelimiter[0].length;
  }
  return { start, end: scanningIndex };
};

const captureParam = (text: string, start: number): null | [number, string] => {
  const opener = "{";
  const closer = "}";
  if (text[start] !== opener) {
    throw new Error(`Start character should be "${opener}"`);
  }
  const range = findNestedExpression(text, opener, closer, start);
  if (range === null) return null;
  const param = text.slice(range.start + 1, range.end - 1);
  return [range.end, param];
};

interface TexCommand {
  params: string[];
  name: string;
  start: number;
  end: number;
}

const findTexCommand = (
  tex: string,
  name: string,
  numArgs: number
): TexCommand | null => {
  const command = `\\${name}`;
  const start = tex.indexOf(`${command}{`);
  if (start < 0) return null;
  const params = [];
  let currentIndex = start + command.length;
  while (params.length < numArgs) {
    const result = captureParam(tex, currentIndex);
    if (result === null) {
      throw new Error("Too few params.");
    }
    const [paramEnd, param] = result;
    params.push(param);
    currentIndex = paramEnd;
  }
  return {
    start,
    end: currentIndex,
    name,
    params,
  };
};

type CommandReplacer = (command: TexCommand) => string;

const replaceAllTexCommand = (
  tex: string,
  name: string,
  numArgs: number,
  replacer: CommandReplacer
) => {
  let withReplacements = tex;
  let command: TexCommand | null;
  // eslint-disable-next-line no-cond-assign
  while ((command = findTexCommand(withReplacements, name, numArgs))) {
    const replacement = replacer(command);
    withReplacements = [
      withReplacements.slice(0, command.start),
      replacement,
      withReplacements.slice(command.end),
    ].join("");
  }
  return withReplacements;
};

export { findNestedExpression, findTexCommand, replaceAllTexCommand };
export type { CommandReplacer, TexCommand };
