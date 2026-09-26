// Minimale zip-schrijver (methode "store", zonder compressie), bruikbaar in de
// browser. Handouts (pdf, pptx, docx, afbeeldingen) zijn al gecomprimeerd, dus
// comprimeren levert weinig op. Geen externe afhankelijkheid nodig.

export type ZipBestand = { naam: string; data: Uint8Array };

const CRC_TABEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABEL[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Datum/tijd in DOS-formaat (zoals zip het verwacht). */
function dosTijd(d: Date): { tijd: number; datum: number } {
  return {
    tijd: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    datum: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** Maakt bestandsnamen uniek binnen de zip: "a.pdf", "a (2).pdf", … */
export function uniekeNamen(namen: string[]): string[] {
  const gezien = new Map<string, number>();
  return namen.map((naam) => {
    const schoon = naam.replace(/[\\/:*?"<>|\r\n]+/g, '_').trim() || 'bestand';
    const n = (gezien.get(schoon.toLowerCase()) ?? 0) + 1;
    gezien.set(schoon.toLowerCase(), n);
    if (n === 1) return schoon;
    const punt = schoon.lastIndexOf('.');
    return punt > 0 ? `${schoon.slice(0, punt)} (${n})${schoon.slice(punt)}` : `${schoon} (${n})`;
  });
}

export function maakZip(bestanden: ZipBestand[], nu = new Date()): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const { tijd, datum } = dosTijd(nu);
  const lokaal: Uint8Array[] = [];
  const centraal: Uint8Array[] = [];
  let offset = 0;

  for (const b of bestanden) {
    const naam = enc.encode(b.naam);
    const crc = crc32(b.data);
    const kop = new Uint8Array(30 + naam.length);
    const v = new DataView(kop.buffer);
    v.setUint32(0, 0x04034b50, true); // local file header
    v.setUint16(4, 20, true); // versie nodig
    v.setUint16(6, 0x0800, true); // vlag: UTF-8-namen
    v.setUint16(8, 0, true); // methode: store
    v.setUint16(10, tijd, true);
    v.setUint16(12, datum, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, b.data.length, true);
    v.setUint32(22, b.data.length, true);
    v.setUint16(26, naam.length, true);
    v.setUint16(28, 0, true);
    kop.set(naam, 30);
    lokaal.push(kop, b.data);

    const c = new Uint8Array(46 + naam.length);
    const w = new DataView(c.buffer);
    w.setUint32(0, 0x02014b50, true); // central directory header
    w.setUint16(4, 20, true);
    w.setUint16(6, 20, true);
    w.setUint16(8, 0x0800, true);
    w.setUint16(10, 0, true);
    w.setUint16(12, tijd, true);
    w.setUint16(14, datum, true);
    w.setUint32(16, crc, true);
    w.setUint32(20, b.data.length, true);
    w.setUint32(24, b.data.length, true);
    w.setUint16(28, naam.length, true);
    w.setUint32(42, offset, true);
    c.set(naam, 46);
    centraal.push(c);

    offset += kop.length + b.data.length;
  }

  const centraalGrootte = centraal.reduce((s, c) => s + c.length, 0);
  const einde = new Uint8Array(22);
  const e = new DataView(einde.buffer);
  e.setUint32(0, 0x06054b50, true); // end of central directory
  e.setUint16(8, bestanden.length, true);
  e.setUint16(10, bestanden.length, true);
  e.setUint32(12, centraalGrootte, true);
  e.setUint32(16, offset, true);

  const delen = [...lokaal, ...centraal, einde];
  const totaal = delen.reduce((s, d) => s + d.length, 0);
  const uit = new Uint8Array(new ArrayBuffer(totaal));
  let pos = 0;
  for (const d of delen) {
    uit.set(d, pos);
    pos += d.length;
  }
  return uit;
}
