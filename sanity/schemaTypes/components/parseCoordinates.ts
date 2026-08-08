/**
 * Mengubah apa pun yang ditempel staf ke kotak "Titik Lokasi" menjadi
 * pasangan koordinat, atau null kalau tidak terbaca.
 *
 * Ditaruh di sebelah locationInput.tsx, bukan di src/lib/, karena sanity/
 * dibangun tanpa alias `@/` — menaruhnya lokal menghindari perlu memasang
 * alias hanya untuk satu import.
 *
 * Sengaja mengembalikan null daripada menebak. Parser yang diam-diam
 * menghasilkan koordinat yang *nyaris* benar lebih buruk daripada yang
 * langsung menolak, karena pin yang meleset 40 km tetap terlihat masuk akal
 * bagi siapa pun yang menempelkannya — pemanggil menampilkan error sebagai
 * gantinya.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Google Maps mengkodekan titik yang sama dengan beberapa cara, dan staf
 * akan menempel apa pun yang muncul di layar mereka. Diurutkan dari yang
 * paling bisa dipercaya:
 *
 * 1. `!3d<lat>!4d<lng>` di dalam blob `data=` URL /place/ — pin sesungguhnya.
 * 2. `?q=<lat>,<lng>` — query koordinat eksplisit.
 * 3. `@<lat>,<lng>,<zoom>z` — *titik tengah viewport*, yang cuma dekat
 *    dengan pin. Pilihan terakhir justru karena inilah yang bisa meleset.
 *
 * Tidak ditangani: short link `maps.app.goo.gl`, yang sama sekali tidak
 * mengandung koordinat dan butuh request jaringan untuk di-resolve. Ini
 * jatuh ke null.
 */
const URL_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
];

/** Pasangan telanjang: "-7.8179, 111.0704", "-7.8179,111.0704",
 * "-7.8179 111.0704". Di-anchor supaya sisa teks di belakang ditolak,
 * bukan terbaca separuh. */
const PAIR = /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/;

function valid(lat: number, lng: number): Coordinates | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Ini juga jadi penjaga pertukaran: pasangan yang tertukar untuk
  // Indonesia menaruh bujur (~111) di slot lintang, yang di luar jangkauan
  // dan tertangkap di sini.
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseCoordinates(input: string): Coordinates | null {
  const text = input.trim();
  if (!text) return null;

  const pair = PAIR.exec(text);
  if (pair) return valid(Number(pair[1]), Number(pair[2]));

  for (const pattern of URL_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const found = valid(Number(match[1]), Number(match[2]));
      if (found) return found;
    }
  }

  return null;
}
