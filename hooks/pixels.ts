export type Mode = 'requesting' | 'responding' | 'thinking' | 'tool-input' | 'tool-use'

const APPLE = [
  '.....S..',
  '....SL..',
  '.GGGGGG.',
  'GGGGGGGG',
  '.GCCCCG.',
  '...CC...',
  '.GCCCCG.',
  'GGGGGGGG',
  '.GGGGGG.',
]

const COLORS: Record<string, number> = {
  G: 0x22ae63,
  C: 0xecdc86,
  S: 0x8a5a44,
  L: 0x386e35,
}
const BRIGHT: Record<string, number> = { ...COLORS, G: 0x5fd894, C: 0xfff2a8 }
const DEFAULT = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584

export const WIDTH = 10
const HEIGHT = 12
export const ROWS = HEIGHT / 2

type Pose = { dx: number; dy: number; mirror?: boolean; squeeze?: boolean; bright?: boolean }

// Each mode loops through its poses at one pose per tick.
const POSES: Record<Mode, Pose[]> = {
  thinking: [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
  responding: [{ dx: 0, dy: 0 }, { dx: 0, dy: 0, squeeze: true }, { dx: 0, dy: 0, mirror: true }, { dx: 0, dy: 0, squeeze: true }],
  requesting: [{ dx: 0, dy: 0, bright: true }, { dx: 0, dy: 0 }, { dx: 0, dy: 0, bright: true }, { dx: 0, dy: 0 }, { dx: 0, dy: 0 }, { dx: 0, dy: 0 }],
  'tool-input': [{ dx: 0, dy: 0 }, { dx: 0, dy: -2 }, { dx: 0, dy: -3 }, { dx: 0, dy: -2 }],
  'tool-use': [{ dx: 0, dy: 0 }, { dx: 0, dy: -2 }, { dx: 0, dy: -3 }, { dx: 0, dy: -2 }],
}

const pixelGrid = ({ dx, dy, mirror, squeeze, bright }: Pose) => {
  const palette = bright ? BRIGHT : COLORS
  const grid: (number | null)[][] = Array.from({ length: HEIGHT }, () => Array<number | null>(WIDTH).fill(null))
  const top = HEIGHT - APPLE.length + dy

  APPLE.forEach((line, y) => {
    let row = mirror ? [...line].reverse().join('') : line
    if (squeeze) {
      row = `..${[...row].filter((_, x) => x % 2 === 1).join('')}..`
    }
    ;[...row].forEach((ch, x) => {
      const target = grid[top + y]
      if (ch !== '.' && target) {
        target[x + 1 + dx] = palette[ch] ?? null
      }
    })
  })

  return grid
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const toBase64 = (bytes: Uint8Array) => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += BASE64[(n >> 18) & 63]! + BASE64[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? BASE64[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? BASE64[n & 63]! : '='
  }
  return out
}

// One cell holds two pixels: a half block's foreground paints one, its background the other.
export const frameCells = (mode: Mode, tick: number) => {
  const poses = POSES[mode]
  const grid = pixelGrid(poses[tick % poses.length]!)
  const words = new Uint32Array(WIDTH * ROWS * 3)

  for (let row = 0; row < ROWS; row++) {
    for (let x = 0; x < WIDTH; x++) {
      const top = grid[row * 2]?.[x] ?? null
      const bottom = grid[row * 2 + 1]?.[x] ?? null
      const i = (row * WIDTH + x) * 3
      const onlyBottom = top === null && bottom !== null
      words[i] = top === null && bottom === null ? 0x20 : onlyBottom ? LOWER_HALF : UPPER_HALF
      words[i + 1] = (onlyBottom ? bottom : top) ?? DEFAULT
      words[i + 2] = (onlyBottom ? null : bottom) ?? DEFAULT
    }
  }

  return toBase64(new Uint8Array(words.buffer))
}
