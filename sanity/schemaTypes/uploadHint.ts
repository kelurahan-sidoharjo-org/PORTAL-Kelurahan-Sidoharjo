/**
 * Drag-and-drop tetap diaktifkan, supaya staf bisa mengunggah dengan cara
 * apa pun yang mereka suka — tapi foto HP mentah sekitar 4 MB dari kuota
 * 5 GB, sementara sumber "Select" memperkecilnya dulu ke sekitar 300 KB.
 * Karena itu tiap field gambar mengarahkan ke Select, bukan memaksanya.
 *
 * Memaksa adalah desain awalnya; itu membuat Sanity merender "Can't upload
 * files here" yang abu-abu, yang dibaca staf non-teknis sebagai field
 * rusak. Lihat catatan anggaran penyimpanan di README.md untuk ongkos
 * dari pertukaran ini.
 */
export const UPLOAD_HINT =
  'Sebaiknya unggah lewat "Select" agar ukuran foto otomatis diperkecil.';

/** Menambahkan hint ini ke description field itu sendiri. */
export function withUploadHint(description?: string): string {
  return description ? `${UPLOAD_HINT} ${description}` : UPLOAD_HINT;
}
