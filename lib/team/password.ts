import { randomInt } from 'node:crypto'

// No 0/O, 1/l/I: these passwords get read out loud or copied from a screen.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const ALL = UPPER + LOWER + DIGITS

/**
 * A random one-time password using a cryptographically secure generator, guaranteed to
 * contain an upper-case letter, a lower-case letter and a digit.
 */
export function generateTempPassword(length = 14, pick: (max: number) => number = randomInt): string {
  const chars = [UPPER, LOWER, DIGITS].map((set) => set[pick(set.length)])
  while (chars.length < length) chars.push(ALL[pick(ALL.length)])
  // Fisher-Yates so the guaranteed characters are not always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = pick(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
