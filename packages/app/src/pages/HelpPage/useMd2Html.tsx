import { useMemo } from "react";
import showdown from "showdown";
import { convertLatexToMarkup } from "mathlive";

const mathExtension: showdown.ShowdownExtension = {
  type: "lang",
  regex: /\\\((.*?)\\\)/g,
  replace: (text: string) => {
    return convertLatexToMarkup(text);
  },
};

const useMd2Html = (markdown: string) => {
  const html = useMemo(() => {
    const converter = new showdown.Converter({
      extensions: [mathExtension],
    });
    return converter.makeHtml(markdown);
  }, [markdown]);
  return html;
};

export default useMd2Html;
