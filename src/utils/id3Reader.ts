/**
 * Lightweight client-side ID3v2 metadata reader.
 * Extracts title, artist, album, year, genre, track, and embedded APIC cover art from an ArrayBuffer.
 */

export interface ParsedId3Tags {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  track?: string;
  genre?: string;
  composer?: string;
  comment?: string;
  artworkBlob?: Blob;
  artworkUrl?: string;
}

export function parseId3v2Tags(buffer: ArrayBuffer): ParsedId3Tags {
  const result: ParsedId3Tags = {};
  const view = new DataView(buffer);

  // Check ID3 identifier
  if (buffer.byteLength < 10) return result;
  const id3 = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
  if (id3 !== 'ID3') return result;

  const version = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
  // Read synchsafe tag size (7 bits per byte)
  const tagSize =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  let offset = 10;
  const maxOffset = Math.min(buffer.byteLength, 10 + tagSize);

  while (offset + 10 < maxOffset) {
    const frameId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );

    // Padding reached
    if (frameId.charCodeAt(0) === 0) break;

    let frameSize: number;
    if (version === 4) {
      // synchsafe in v2.4
      frameSize =
        ((view.getUint8(offset + 4) & 0x7f) << 21) |
        ((view.getUint8(offset + 5) & 0x7f) << 14) |
        ((view.getUint8(offset + 6) & 0x7f) << 7) |
        (view.getUint8(offset + 7) & 0x7f);
    } else {
      // standard uint32 in v2.3
      frameSize = view.getUint32(offset + 4, false);
    }

    if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) break;

    const frameDataOffset = offset + 10;

    try {
      if (frameId === 'TIT2') {
        result.title = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TPE1') {
        result.artist = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TALB') {
        result.album = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TPE2') {
        result.albumArtist = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TYER' || frameId === 'TDRC') {
        result.year = decodeTextFrame(view, frameDataOffset, frameSize).slice(0, 4);
      } else if (frameId === 'TRCK') {
        result.track = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TCON') {
        result.genre = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'TCOM') {
        result.composer = decodeTextFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'COMM') {
        result.comment = decodeCommentFrame(view, frameDataOffset, frameSize);
      } else if (frameId === 'APIC') {
        const art = decodePictureFrame(buffer, frameDataOffset, frameSize);
        if (art) {
          result.artworkBlob = art.blob;
          result.artworkUrl = art.url;
        }
      }
    } catch {
      // Ignore individual corrupted frame
    }

    offset += 10 + frameSize;
  }

  return result;
}

function decodeTextFrame(view: DataView, offset: number, size: number): string {
  if (size <= 1) return '';
  const encoding = view.getUint8(offset);
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 1, size - 1);
  return decodeByEncoding(bytes, encoding).replace(/\0/g, '').trim();
}

function decodeCommentFrame(view: DataView, offset: number, size: number): string {
  if (size <= 4) return '';
  const encoding = view.getUint8(offset);
  // language is 3 bytes (offset+1, offset+2, offset+3)
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 4, size - 4);
  const raw = decodeByEncoding(bytes, encoding);
  // COMM format: [description]\0[text]
  const parts = raw.split('\0');
  return parts.length > 1 ? parts.slice(1).join('\0').trim() : raw.trim();
}

function decodePictureFrame(
  buffer: ArrayBuffer,
  offset: number,
  size: number
): { blob: Blob; url: string } | null {
  const view = new DataView(buffer, offset, size);
  if (size <= 10) return null;

  const encoding = view.getUint8(0);
  let pos = 1;

  // Read MIME type (ISO-8859-1 null terminated)
  let mimeType = '';
  while (pos < size && view.getUint8(pos) !== 0) {
    mimeType += String.fromCharCode(view.getUint8(pos));
    pos++;
  }
  pos++; // skip null
  if (!mimeType) mimeType = 'image/jpeg';

  // Skip Picture Type (1 byte)
  pos++;

  // Skip description (null terminated according to encoding)
  if (encoding === 0 || encoding === 3) {
    // 1-byte null
    while (pos < size && view.getUint8(pos) !== 0) pos++;
    pos++;
  } else {
    // 2-byte null for unicode
    while (pos + 1 < size && (view.getUint8(pos) !== 0 || view.getUint8(pos + 1) !== 0)) pos += 2;
    pos += 2;
  }

  if (pos >= size) return null;

  const imgBytes = buffer.slice(offset + pos, offset + size);
  const blob = new Blob([imgBytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

function decodeByEncoding(bytes: Uint8Array, encoding: number): string {
  try {
    if (encoding === 0) {
      // ISO-8859-1
      return new TextDecoder('iso-8859-1').decode(bytes);
    } else if (encoding === 1) {
      // UTF-16 with BOM
      return new TextDecoder('utf-16').decode(bytes);
    } else if (encoding === 2) {
      // UTF-16BE
      return new TextDecoder('utf-16be').decode(bytes);
    } else if (encoding === 3) {
      // UTF-8
      return new TextDecoder('utf-8').decode(bytes);
    }
  } catch {}
  return new TextDecoder('utf-8').decode(bytes);
}
