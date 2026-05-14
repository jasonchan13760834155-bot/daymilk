// Generate minimal valid PNG icons using pure JS (no native deps)
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

// Minimal PNG encoder - creates a solid-color PNG
function createSolidPNG(r, g, b, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT chunk - raw RGB data with filter byte 0 per row
  const rawSize = size * (1 + size * 3)
  const rawData = Buffer.alloc(rawSize)
  for (let y = 0; y < size; y++) {
    rawData[y * (1 + size * 3)] = 0
    for (let x = 0; x < size; x++) {
      const offset = y * (1 + size * 3) + 1 + x * 3
      rawData[offset] = r
      rawData[offset + 1] = g
      rawData[offset + 2] = b
    }
  }

  const compressed = deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeB = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([typeB, data]))
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc, 0)
  return Buffer.concat([length, typeB, data, crcB])
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Generate icons - solid #EC4899 (primary pink)
const [r, g, b] = [0xEC, 0x48, 0x99]

const icon192 = createSolidPNG(r, g, b, 192)
writeFileSync('public/icon-192.png', icon192)
console.log(`Created public/icon-192.png (${icon192.length} bytes)`)

const icon512 = createSolidPNG(r, g, b, 512)
writeFileSync('public/icon-512.png', icon512)
console.log(`Created public/icon-512.png (${icon512.length} bytes)`)
