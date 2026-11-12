/**
 * Makes free text safe to embed in a PostgREST `.or()` filter string, where
 * commas and parentheses separate conditions and % / * act as wildcards.
 * Returns undefined when nothing searchable is left.
 */
export function sanitizeSearch(input: string | undefined | null): string | undefined {
  const cleaned = (input ?? '').replace(/[,()"\\%*]/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.length > 0 ? cleaned : undefined
}
