import React, { useMemo } from "react";
import Showdown from "showdown";

const anchorTargetBlank: Showdown.ShowdownExtension[] = [
  {
    type: "html",
    regex: /(<a [^>]+?)(>.*<\/a>)/g,
    replace: '$1 target="_blank"$2',
  },
];

const converter = new Showdown.Converter({
  extensions: [...anchorTargetBlank],
});

type MarkdownProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: string;
};
const Markdown: React.FC<MarkdownProps> = ({ children, ...props }) => {
  const html = useMemo(() => {
    return converter.makeHtml(children as string);
  }, [children]);
  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
};
export default Markdown;
