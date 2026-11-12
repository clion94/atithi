'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ErrorState from '@/components/ui/ErrorState'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import {
  deleteGuestDocument,
  getGuestDocuments,
  uploadGuestDocument,
  type GuestDocumentWithUrl,
} from '@/lib/services/documents'
import { errorMessage } from '@/lib/utils/errors'
import { formatDateTime } from '@/lib/utils/dates'
import type { Guest, GuestDocument } from '@/types'

const KINDS: GuestDocument['kind'][] = ['id_front', 'id_back', 'other']

interface IdDocumentsProps {
  guest: Guest
  /** Owners and managers may delete stored photos. */
  canDelete: boolean
}

export default function IdDocuments({ guest, canDelete }: IdDocumentsProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<GuestDocument['kind']>('id_front')
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<GuestDocumentWithUrl | null>(null)
  const [deleting, setDeleting] = useState(false)

  const docs = useQuery({
    queryKey: ['guest-documents', guest.id],
    queryFn: () => getGuestDocuments(guest.id),
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['guest-documents', guest.id] })

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('documents.notAnImage'))
      return
    }
    setUploading(true)
    try {
      await uploadGuestDocument({ file, guest, kind })
      await refresh()
      toast.success(t('documents.photoSaved'))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function onDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteGuestDocument(toDelete)
      await refresh()
      toast.success(t('documents.photoRemoved'))
      setToDelete(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary">{t('documents.idPhotos')}</h2>
          <p className="mt-1 max-w-md text-xs text-gray-500">{t('documents.idPhotosPrivacy')}</p>
        </div>
        <div className="flex items-end gap-2">
          <Select
            aria-label={t('documents.photoType')}
            value={kind}
            onChange={(e) => setKind(e.target.value as GuestDocument['kind'])}
            options={KINDS.map((k) => ({ value: k, label: t(`documents.kinds.${k}`) }))}
            className="min-h-9 py-1 text-sm"
          />
          <Button size="sm" loading={uploading} onClick={() => fileInput.current?.click()}>
            <Camera className="h-4 w-4" />
            {t('documents.addPhoto')}
          </Button>
          {/* capture=environment opens the rear camera on phones; on a desktop it is a file picker */}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onPick}
            data-testid="id-photo-input"
          />
        </div>
      </div>

      {docs.error ? (
        <ErrorState message={docs.error.message} onRetry={() => docs.refetch()} />
      ) : docs.isPending ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      ) : docs.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">{t('documents.noPhotos')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {docs.data.map((doc) => (
            <li key={doc.id} className="overflow-hidden rounded-2xl ring-1 ring-black/5">
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {/* Signed, short-lived URL from private storage: next/image's optimizer cannot cache it. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.url}
                    alt={t('documents.photoAlt', { kind: t(`documents.kinds.${doc.kind}`) })}
                    className="aspect-[4/3] w-full bg-black/5 object-cover"
                  />
                </a>
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-black/5 text-xs text-gray-400">
                  {t('documents.unavailable')}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-secondary">{t(`documents.kinds.${doc.kind}`)}</p>
                  <p className="truncate text-[11px] text-gray-400">{formatDateTime(doc.created_at)}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => setToDelete(doc)}
                    aria-label={t('documents.removePhoto')}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={t('documents.removePhoto')} size="sm">
        <p className="mb-6 text-sm text-gray-600">{t('documents.removeConfirm')}</p>
        <div className="flex gap-3">
          <Button variant="danger" className="flex-1" loading={deleting} onClick={onDelete}>
            {t('actions.delete')}
          </Button>
          <Button variant="outline" onClick={() => setToDelete(null)}>
            {t('actions.cancel')}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
