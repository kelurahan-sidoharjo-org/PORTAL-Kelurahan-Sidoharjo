import { Children } from "react";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Merender docs/panduan-staf.md sebagai halaman /panduan.
 *
 * Peta `components` ditulis tangan, bukan @tailwindcss/typography:
 * jumlah barisnya mirip, menghindari dependensi ketiga, dan panduannya
 * memakai font/warna brand sendiri, bukan tema generik.
 *
 * Preflight Tailwind menghapus styling elemen bawaan, jadi elemen yang
 * belum ada di sini dirender tanpa style, bukan error.
 *
 * remark-gfm wajib: panduannya kebanyakan tabel, ekstensi GitHub-Flavored
 * yang tidak dimiliki Markdown polos.
 */

/** Screenshot untuk beberapa langkah masih belum ada — lihat docs/handover.md langkah 6. */
const PLACEHOLDER = /^!\[tangkapan layar:\s*(.+?)\]$/;

/** Meratakan tree children React jadi teks polos, untuk pengecekan placeholder. */
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
  // `![alt]` tanpa `(url)` bukan gambar di Markdown — teks literal, yang
  // kalau dibiarkan dirender mentah. Placeholder berlabel membuatnya
  // terlihat sengaja sampai screenshot-nya ada; tidak berbiaya sesudahnya
  // karena sintaks gambar sungguhan berhenti cocok.
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
        // Halamannya merender <h1> sendiri lewat PageHeading, jadi judul
        // file diturunkan jadi paragraf pembuka.
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
        // <img> polos: screenshot lokal berukuran tak diketahui, dan
        // next/image butuh width/height eksplisit. Loader kustomnya cuma
        // menulis ulang URL cdn.sanity.io, tidak ada yang perlu dioptimasi.
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeof src === "string" ? src : undefined}
            alt={alt ?? ""}
            className="my-5 h-auto w-full rounded-xl border border-black/10"
          />
        ),
        // Tabel terlebar punya empat kolom dan akan mendorong layar HP
        // menyamping. Men-scroll tabelnya, bukan halamannya, menjaga
        // <body> tidak pernah scroll menyamping.
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
