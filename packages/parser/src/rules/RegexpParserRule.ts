import type { TextParserRule } from "../interfaces";
import { ParserRuleType } from "../interfaces";

class TextParserRegexpRule implements TextParserRule {
  readonly type = ParserRuleType.Text;

  constructor(
    private regexp: RegExp,
    private replace: string | ((match: RegExpExecArray) => string)
  ) {}

  transform(text: string) {
    const matches = [
      ...text.matchAll(this.regexp),
    ].reverse() as RegExpExecArray[];
    return matches.reduce((acc, match) => {
      return [
        acc.slice(0, match.index),
        typeof this.replace === "string" ? this.replace : this.replace(match),
        acc.slice(match.index + match[0].length),
      ].join("");
    }, text);
  }
}

export default TextParserRegexpRule;
