/**
 * PDF Sharing, Download, and Print Functions
 */

import type { ShareOptions } from '@/types/pos-pdf'

/**
 * Download PDF blob as a file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw new Error('Échec du téléchargement du PDF')
  }
}

/**
 * Print PDF blob using iframe
 */
export function printPDF(blob: Blob): void {
  try {
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)

    // Wait for iframe to load then print
    iframe.onload = () => {
      iframe.contentWindow?.print()
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
      }, 100)
    }
  } catch (error) {
    console.error('Error printing PDF:', error)
    throw new Error("Échec de l'impression du PDF")
  }
}

/**
 * Share PDF using Web Share API with fallback to download
 * Note: File sharing requires HTTPS and browser support
 */
export async function sharePDF(
  blob: Blob,
  filename: string,
  options?: ShareOptions
): Promise<void> {
  try {
    // Create File object (required for share API, not Blob)
    const file = new File([blob], filename, { type: 'application/pdf' })

    // Check if Web Share API is supported and can share files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: options?.title || 'Ticket de vente',
        text: options?.text || 'Voici votre ticket de vente',
        files: [file],
      })
    } else {
      // Fallback to download if share not supported
      console.warn('Web Share API not supported for files, falling back to download')
      downloadPDF(blob, filename)
    }
  } catch (error) {
    // User cancelled share or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled - this is ok, don't throw
      console.log('Share cancelled by user')
      return
    }
    console.error('Error sharing PDF:', error)
    // Fallback to download on error
    downloadPDF(blob, filename)
  }
}

/**
 * Check if Web Share API is available for files
 */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator
  )
}
