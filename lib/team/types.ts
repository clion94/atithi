export const ERROR_CODES = [
  'unauthorized',
  'forbidden',
  'self',
  'role_not_allowed',
  'invalid',
  'email_taken',
  'not_configured',
  'last_owner',
  'not_found',
  'failed',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; code: ErrorCode }

/** Shown once to whoever created the login; it is never stored or logged. */
export interface Credentials {
  email: string
  tempPassword: string
}
