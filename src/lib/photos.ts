import imageCompression from 'browser-image-compression'

/** Resize and re-encode before storing/uploading. ~1600px long edge, JPEG 0.8. */
export async function compressPhoto(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.8,
    initialQuality: 0.8,
    fileType: 'image/jpeg',
    useWebWorker: true,
  })
}
