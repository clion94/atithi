/**
 * Turns whatever a Supabase call threw into an Error with a message that is
 * fit to show in a toast. Postgres error codes are mapped to plain language;
 * messages raised on purpose by our database rules (e.g. "Room 102 is out of
 * order") are passed through unchanged.
 */
export function toError(e: unknown): Error {
  const err = e as { code?: string; message?: string } | null
  const message = err?.message ?? 'Something went wrong'

  if (err?.code === '23P01') {
    return new Error('That room is already booked for some of those dates.')
  }
  if (err?.code === '42501' && /row-level security|permission denied/i.test(message)) {
    return new Error("You don't have permission to do that.")
  }
  if (/permission denied/i.test(message)) {
    return new Error("You don't have permission to do that.")
  }
  return e instanceof Error ? e : new Error(message)
}

export function errorMessage(e: unknown): string {
  return toError(e).message
}
