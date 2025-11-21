'use client'

/**
 * POS Receipt PDF Generator Component
 * Uses server-side PDF generation for better performance
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Printer, Share2, Loader2 } from 'lucide-react'
import { PAGE_FORMATS, type PageFormat } from '@/lib/pos/pdf-formats'
import { sharePDF, canShareFiles } from '@/lib/pos/pdf-share'

interface POSReceiptGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  saleNumber: string
}

export function POSReceiptGenerator({
  open,
  onOpenChange,
  saleId,
  saleNumber,
}: POSReceiptGeneratorProps) {
  const [format, setFormat] = useState<PageFormat>('THERMAL_80MM')
  const [loading, setLoading] = useState(false)
  const shareSupported = canShareFiles()

  const getPDFUrl = () => {
    const params = new URLSearchParams({
      saleId,
      format,
    })
    return `/api/pos/receipt?${params.toString()}`
  }

  const getFilename = () => `ticket-${saleNumber}.pdf`

  const handleDownload = async () => {
    try {
      setLoading(true)
      const response = await fetch(getPDFUrl())
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getFilename()
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Échec du téléchargement du PDF')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      setLoading(true)
      const response = await fetch(getPDFUrl())
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      iframe.onload = () => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 100)
      }
    } catch (error) {
      console.error('Error printing PDF:', error)
      alert("Échec de l'impression du PDF")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      setLoading(true)
      const response = await fetch(getPDFUrl())
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      await sharePDF(blob, getFilename(), {
        title: 'Ticket de vente',
        text: `Ticket #${saleNumber}`,
      })
    } catch (error) {
      console.error('Error sharing PDF:', error)
      // sharePDF already has fallback to download
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Ticket de vente PDF</DialogTitle>
          <DialogDescription>
            Ticket #{saleNumber} - Sélectionnez le format et l&apos;action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selector */}
          <div className="space-y-2">
            <Label htmlFor="format">Format du ticket</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as PageFormat)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAGE_FORMATS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label} - {config.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              PDF prêt pour {PAGE_FORMATS[format].label}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Utilisez les boutons ci-dessous pour télécharger, imprimer ou partager
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Download button */}
            <Button
              variant="default"
              className="w-full"
              disabled={loading}
              onClick={handleDownload}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Télécharger
            </Button>

            {/* Print button */}
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handlePrint}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Imprimer
            </Button>

            {/* Share button */}
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleShare}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {shareSupported ? 'Partager' : 'Télécharger'}
            </Button>
          </div>

          {/* Info message for share */}
          {!shareSupported && (
            <p className="text-xs text-gray-500 text-center">
              Le partage direct n&apos;est pas supporté sur cet appareil. Le bouton &ldquo;Partager&rdquo; téléchargera le PDF.
            </p>
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
