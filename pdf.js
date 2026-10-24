/**
 * Minimal PDF text extraction for imported study materials.
 *
 * Only the parts a text-based PDF needs: locate content streams, inflate the
 * FlateDecode ones, and read the text-showing operators. Scanned documents and
 * CID fonts without a usable ToUnicode map cannot be recovered this way, so the
 * caller receives a quality flag instead of silent garbage.
 */
import zlib from 'node:zlib'

/** Decode one PDF literal string body (escapes already delimited by parens). */
function decodeLiteral(raw) {
  let out = ''
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]
    if (char !== '\\') {
      out += char
      continue
    }
    const next = raw[index + 1]
    index += 1
    switch (next) {
      case 'n': out += '\n'; break
      case 'r': out += '\r'; break
      case 't': out += '\t'; break
      case 'b': out += '\b'; break
      case 'f': out += '\f'; break
      case '(': out += '('; break
      case ')': out += ')'; break
      case '\\': out += '\\'; break
      case undefined: break
      default:
        if (next >= '0' && next <= '7') {
          let octal = next
          while (octal.length < 3 && raw[index + 1] >= '0' && raw[index + 1] <= '7') {
            octal += raw[index + 1]
            index += 1
          }
          out += String.fromCharCode(Number.parseInt(octal, 8))
        } else {
          out += next
        }
    }
  }
  return out
}

/** Decode a hex string body into characters. */
function decodeHex(raw) {
  const compact = raw.replace(/\s/gu, '')
  let out = ''
  for (let index = 0; index + 1 < compact.length; index += 2) {
    out += String.fromCharCode(Number.parseInt(compact.slice(index, index + 2), 16))
  }
  return out
}

/**
 * Read the text operators out of one decoded content stream.
 * @param content - decoded stream bytes as a latin1 string.
 */
function readContentStream(content) {
  const pieces = []
  let cursor = 0
  let pendingNewline = false

  const flushNewline = () => {
    if (pendingNewline) {
      pieces.push('\n')
      pendingNewline = false
    }
  }

  while (cursor < content.length) {
    const char = content[cursor]

    if (char === '(') {
      // Literal string: walk to the matching close paren, honouring escapes.
      let depth = 1
      let index = cursor + 1
      let body = ''
      while (index < content.length && depth > 0) {
        const current = content[index]
        if (current === '\\') {
          body += current + (content[index + 1] ?? '')
          index += 2
          continue
        }
        if (current === '(') depth += 1
        if (current === ')') {
          depth -= 1
          if (depth === 0) break
        }
        body += current
        index += 1
      }
      const text = decodeLiteral(body)
      if (text.length > 0) {
        flushNewline()
        pieces.push(text)
      }
      cursor = index + 1
      continue
    }

    if (char === '<' && content[cursor + 1] !== '<') {
      const end = content.indexOf('>', cursor)
      if (end === -1) break
      const text = decodeHex(content.slice(cursor + 1, end))
      if (text.length > 0) {
        flushNewline()
        pieces.push(text)
      }
      cursor = end + 1
      continue
    }

    // Layout operators that imply a line break between text runs.
    if (content.startsWith('Td', cursor) || content.startsWith('TD', cursor) || content.startsWith('T*', cursor)) {
      pendingNewline = true
      cursor += 2
      continue
    }
    if (content.startsWith('ET', cursor)) {
      pendingNewline = true
      cursor += 2
      continue
    }

    cursor += 1
  }

  return pieces.join('')
}

/**
 * Walk every `stream … endstream` object and decode the ones we can read.
 * @param latin1 - the whole file as a latin1 string.
 * @returns decoded content streams.
 */
function decodeStreams(latin1) {
  const streams = []
  const pattern = /stream\r?\n/gu
  let match
  while ((match = pattern.exec(latin1)) !== null) {
    const start = match.index + match[0].length
    const end = latin1.indexOf('endstream', start)
    if (end === -1) break
    const raw = latin1.slice(start, end)
    pattern.lastIndex = end + 'endstream'.length

    const bytes = Buffer.from(raw, 'latin1')
    // FlateDecode streams begin with the zlib header 0x78.
    if (bytes.length > 2 && bytes[0] === 0x78) {
      try {
        streams.push(zlib.inflateSync(bytes).toString('latin1'))
        continue
      } catch {
        try {
          streams.push(zlib.inflateRawSync(bytes).toString('latin1'))
          continue
        } catch {
          continue
        }
      }
    }
    // Uncompressed content streams carry text operators directly.
    if (/\bBT\b/u.test(raw) && /\bTj\b/u.test(raw)) streams.push(raw)
  }
  return streams
}

/**
 * Score extracted text so the caller can warn instead of storing noise.
 * @param text - candidate extraction.
 */
function qualityOf(text) {
  if (text.length === 0) return 0
  let readable = 0
  for (const char of text) {
    const code = char.codePointAt(0)
    if (code === 9 || code === 10) {
      readable += 1
      continue
    }
    if (code >= 0x20 && code <= 0x7e) {
      readable += 1
      continue
    }
    if (code >= 0x4e00 && code <= 0x9fff) {
      readable += 1
      continue
    }
    if (code >= 0x3000 && code <= 0x303f) {
      readable += 1
      continue
    }
    if (code >= 0xff00 && code <= 0xffef) {
      readable += 1
      continue
    }
  }
  return readable / text.length
}

/**
 * Extract readable text from a PDF file.
 * @param buffer - the raw PDF bytes.
 * @returns text plus a 0..1 readability score and the stream count used.
 */
export function pdfToText(buffer) {
  const latin1 = buffer.toString('latin1')
  const streams = decodeStreams(latin1)
  const chunks = []
  for (const stream of streams) {
    const text = readContentStream(stream)
    if (text.trim().length > 0) chunks.push(text)
  }

  // Normalise: collapse runs of spaces, trim each line, keep paragraph breaks.
  const joined = chunks
    .join('\n')
    .replace(/\r/gu, '\n')
    .replace(/[ \t]{2,}/gu, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()

  return { text: joined, quality: qualityOf(joined), streams: streams.length }
}
