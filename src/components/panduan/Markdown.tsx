import { Children } from "react";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders docs/panduan-staf.md as the /panduan page.
 *
 * A hand-written `components` map rather than @tailwindcss/typography: it costs
 * about the same number of lines, avoids a third dependency on a project that
 * has to survive without a maintainer, and lets the guide use the site's own
 * fonts and brand colours instead of a generic prose theme.
 *
 * Tailwind's preflight strips default element styling, so every element the
 * guide actually uses has to appear here — a missing entry renders as unstyled
 * text rather than as an error.
 *
 * remark-gfm is not optional: the guide is mostly tables, and tables are a
 * GitHub-Flavored extension that plain Markdown doesn't include.
 */

/** Screenshots still missing for some steps — see docs/handover.md step 6. */
const PLACEHOLDER = /^!\[tangkapan layar:\s*(.+?)\]$/;

/** Flattens a React children tree to plain text, for the placeholder check. */
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : "",
    )
    .join("");
}

function Paragraph({ children }: ComponentProps<"p">) {
  // `![alt]` with no `(url)` is not an image in Markdown — it's literal text,
  // and would otherwise render as raw `![tangkapan layar: ...]` on the page.
  // Drawing it as a labelled placeholder keeps the guide looking deliberate
  // while the screenshots are outstanding, and costs nothing once they land:
  // real image syntax stops matching and renders as a normal image.
  const match = PLACEHOLDER.exec(textOf(children).trim());
  if (match) {
    return (
      <figure className="my-5 grid place-items-center gap-1 rounded-xl border-2 border-dashed border-black/15 bg-black/[0.02] px-4 py-8 text-center">
        <span className="font-heading text-xs font-bold text-muted-foreground">
          Gambar menyusul
        </span>
        <figcaption className="text-xs text-muted-foreground">
          {match[1]}
        </figcaption>
      </figure>
    );
  }

  return <p className="my-3 text-sm leading-relaxed sm:text-base">{children}</p>;
}

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // The page renders its own <h1> via PageHeading, so the file's title
        // would be a duplicate — demote it to a lead paragraph.
        h1: ({ children }) => (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {children}
          </p>
        ),
        h2: ({ children }) => (
          <h2 className="mt-10 scroll-mt-6 border-b border-black/10 pb-2 text-base font-bold sm:text-2xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 text-sm font-bold sm:text-lg">{children}</h3>
        ),
        p: Paragraph,
        ul: ({ children }) => (
          <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed sm:text-base">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed sm:text-base">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold text-brand-navy">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.85em]">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-brand/40 bg-white/40 py-1 pl-4 text-sm sm:text-base">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-8 border-black/10" />,
        // Plain <img>: screenshots are local files of unknown dimensions
        // dropped into public/images/panduan/ by staff, and next/image wants
        // explicit width/height for each. The custom loader only rewrites
        // cdn.sanity.io URLs anyway, so there is nothing to optimise here.
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeof src === "string" ? src : undefined}
            alt={alt ?? ""}
            className="my-5 h-auto w-full rounded-xl border border-black/10"
          />
        ),
        // The guide's widest table has four columns and would push a phone
        // sideways. Scrolling the table instead of the page keeps the rule that
        // <body> never scrolls horizontally.
        table: ({ children }) => (
          <div className="my-5 overflow-x-auto rounded-xl border border-black/10">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-black/[0.04]">{children}</thead>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-black/10 last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-heading font-bold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top">{children}</td>
        ),
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
