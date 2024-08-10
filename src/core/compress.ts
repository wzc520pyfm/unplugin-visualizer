import * as zlib from 'node:zlib'
import { promisify } from 'node:util'
import buffer from 'node:buffer'

const gzip = promisify(zlib.gzip)
const brotliCompress = promisify(zlib.brotliCompress)

function gzipOptions(options: zlib.ZlibOptions): zlib.ZlibOptions {
  return {
    level: 9,
    ...options,
  }
}
function brotliOptions(options: zlib.BrotliOptions, buffer: buffer.Buffer): zlib.BrotliOptions {
  return {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
    },
    ...options,
  }
}

function createGzipCompressor(options: zlib.ZlibOptions) {
  return (buffer: buffer.Buffer) =>
    gzip(buffer, gzipOptions(options || {}))
}

export type SizeGetter = (code: string) => Promise<number>

export function createGzipSizeGetter(options: zlib.ZlibOptions): SizeGetter {
  const compress = createGzipCompressor(options)
  return async (code: string) => {
    const data = await compress(buffer.Buffer.from(code, 'utf-8'))
    return data.length
  }
}

function createBrotliCompressor(options: zlib.BrotliOptions) {
  return (buffer: buffer.Buffer) =>
    brotliCompress(buffer, brotliOptions(options || {}, buffer))
}

export function createBrotliSizeGetter(options: zlib.BrotliOptions): SizeGetter {
  const compress = createBrotliCompressor(options)
  return async (code: string) => {
    const data = await compress(buffer.Buffer.from(code, 'utf-8'))
    return data.length
  }
}
