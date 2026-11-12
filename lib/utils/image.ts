/** Largest edge (px) of a stored ID photo: plenty to read a licence, small to upload on motel Wi-Fi. */
export const ID_PHOTO_MAX_EDGE = 1600
export const ID_PHOTO_QUALITY = 0.85

/** Scales (width, height) down so the longer edge is at most `max`, keeping the aspect ratio. Never upscales. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max || longest === 0) return { width, height }
  const scale = max / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Browser-only: decodes a photo (honouring the phone's rotation), downsizes it and
 * re-encodes it as JPEG. Re-encoding through a canvas also drops EXIF metadata such as GPS location.
 */
export async function resizeToJpeg(
  file: Blob,
  maxEdge = ID_PHOTO_MAX_EDGE,
  quality = ID_PHOTO_QUALITY
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Image processing is not available in this browser')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Could not process that image')
    return blob
  } finally {
    bitmap.close()
  }
}
