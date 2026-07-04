import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "./code-block";

const components: Components = {
  // Let CodeBlock own the wrapping element for fenced code so it isn't
  // nested inside markdown's own auto-generated <pre>.
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const code = String(children).replace(/\n$/, "");

    if (!match) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">{children}</code>
      );
    }

    return <CodeBlock language={match[1]} code={code} />;
  },
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
