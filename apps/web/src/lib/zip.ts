// Minimal ZIP builder (store-only, no compression) for exporting small text projects client-side.
// Produces a standards-compliant ZIP with CRC32 + central directory.

type ZipInput = { path: string; data: string | Uint8Array };

const textEncoder = new TextEncoder();

function u16(n: number) {
  const a = new Uint8Array(2);
  a[0] = n & 0xff;
  a[1] = (n >>> 8) & 0xff;
  return a;
}

function u32(n: number) {
  const a = new Uint8Array(4);
  a[0] = n & 0xff;
  a[1] = (n >>> 8) & 0xff;
  a[2] = (n >>> 16) & 0xff;
  a[3] = (n >>> 24) & 0xff;
  return a;
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

// CRC32 implementation (IEEE 802.3)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function toDosDateTime(d: Date) {
  const year = Math.max(1980, d.getFullYear());
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = Math.floor(d.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

export function buildZipBlob(inputs: ZipInput[], opts?: { modifiedAt?: Date }): Blob {
  const modifiedAt = opts?.modifiedAt ?? new Date();
  const { dosTime, dosDate } = toDosDateTime(modifiedAt);

  const fileRecords: {
    pathBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    localHeaderOffset: number;
  }[] = [];

  const localParts: Uint8Array[] = [];
  let offset = 0;

  for (const input of inputs) {
    const path = String(input.path || "").replace(/^\/+/, "");
    if (!path) continue;
    const pathBytes = textEncoder.encode(path);
    const dataBytes = typeof input.data === "string" ? textEncoder.encode(input.data) : input.data;
    const crc = crc32(dataBytes);

    const localHeader = concat([
      u32(0x04034b50), // local file header signature
      u16(20), // version needed to extract
      u16(0), // flags
      u16(0), // compression method (0 = store)
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(dataBytes.byteLength),
      u32(dataBytes.byteLength),
      u16(pathBytes.byteLength),
      u16(0), // extra length
      pathBytes,
    ]);

    const localHeaderOffset = offset;
    localParts.push(localHeader, dataBytes);
    offset += localHeader.byteLength + dataBytes.byteLength;

    fileRecords.push({ pathBytes, dataBytes, crc, localHeaderOffset });
  }

  const centralParts: Uint8Array[] = [];
  const centralDirOffset = offset;

  for (const r of fileRecords) {
    const centralHeader = concat([
      u32(0x02014b50), // central file header signature
      u16(0x0314), // version made by (3.20)
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression (store)
      u16(dosTime),
      u16(dosDate),
      u32(r.crc),
      u32(r.dataBytes.byteLength),
      u32(r.dataBytes.byteLength),
      u16(r.pathBytes.byteLength),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk number
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(r.localHeaderOffset),
      r.pathBytes,
    ]);
    centralParts.push(centralHeader);
    offset += centralHeader.byteLength;
  }

  const centralDirSize = offset - centralDirOffset;

  const eocd = concat([
    u32(0x06054b50), // end of central dir signature
    u16(0), // disk number
    u16(0), // disk with central dir
    u16(fileRecords.length),
    u16(fileRecords.length),
    u32(centralDirSize),
    u32(centralDirOffset),
    u16(0), // comment length
  ]);

  const bytes = concat([...localParts, ...centralParts, eocd]);
  return new Blob([bytes], { type: "application/zip" });
}

