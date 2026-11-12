import { createClient } from '@/lib/supabase/client'
import type { Guest, GuestDocument } from '@/types'
import { toError } from '@/lib/utils/errors'
import { resizeToJpeg } from '@/lib/utils/image'

const BUCKET = 'guest-ids'
/** Signed links last five minutes: long enough to look at a photo, too short to share around. */
const URL_TTL_SECONDS = 300

export interface GuestDocumentWithUrl extends GuestDocument {
  url: string | null
}

export async function getGuestDocuments(guestId: string): Promise<GuestDocumentWithUrl[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('guest_documents')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
  if (error) throw toError(error)
  if (data.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      data.map((d) => d.storage_path),
      URL_TTL_SECONDS
    )
  if (signError) throw toError(signError)

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))
  return data.map((d) => ({ ...d, url: urlByPath.get(d.storage_path) ?? null }))
}

/**
 * Uploads an ID photo to the private bucket and records it. Files live under
 * <property>/<guest>/..., which is also what the storage policies enforce.
 * If recording fails the uploaded file is removed again so no orphan photo is left behind.
 */
export async function uploadGuestDocument(input: {
  file: File
  guest: Pick<Guest, 'id' | 'property_id'>
  kind: GuestDocument['kind']
}): Promise<GuestDocument> {
  const supabase = createClient()
  const { guest, kind } = input

  const blob = await resizeToJpeg(input.file)
  const path = `${guest.property_id}/${guest.id}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw toError(uploadError)

  const { data, error } = await supabase
    .from('guest_documents')
    .insert({ property_id: guest.property_id, guest_id: guest.id, storage_path: path, kind })
    .select()
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw toError(error)
  }
  return data
}

/** Owners and managers only (row level security). The file goes first so no photo outlives its record. */
export async function deleteGuestDocument(doc: Pick<GuestDocument, 'id' | 'storage_path'>): Promise<void> {
  const supabase = createClient()
  const { error: removeError } = await supabase.storage.from(BUCKET).remove([doc.storage_path])
  if (removeError) throw toError(removeError)

  const { error } = await supabase.from('guest_documents').delete().eq('id', doc.id)
  if (error) throw toError(error)
}
