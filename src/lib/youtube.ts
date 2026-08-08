/**
 * Mengubah URL YouTube apa pun yang ditempel staf menjadi URL yang bisa
 * disematkan (embed).
 *
 * Mereka akan menyalin dari address bar, tombol Share, atau aplikasi mobile,
 * dan ketiganya menghasilkan tiga bentuk berbeda. Apa pun yang tidak
 * dikenali mengembalikan null supaya pemanggilnya bisa melewati render
 * daripada menampilkan pemutar yang rusak.
 */
export function toEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    // https://youtu.be/<id>
    id = url.pathname.slice(1) || null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      id = url.pathname.slice("/embed/".length) || null;
    } else if (url.pathname.startsWith("/shorts/")) {
      id = url.pathname.slice("/shorts/".length) || null;
    }
  }

  // ID video terdiri dari 11 karakter [A-Za-z0-9_-]; selain itu berarti tempelan yang salah.
  if (!id || !/^[\w-]{11}$/.test(id)) return null;

  return `https://www.youtube.com/embed/${id}`;
}
