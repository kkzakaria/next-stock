/**
 * PDF Utility Functions
 * QR code generation, logo handling, and data formatting
 */

import QRCode from 'qrcode'
import type { QRCodeData, SaleData } from '@/types/pos-pdf'

/**
 * Generate QR code as base64 PNG data URL
 * Returns a promise that resolves to a data URL suitable for <Image> component
 */
export async function generateQRCode(data: QRCodeData): Promise<string> {
  try {
    const jsonData = JSON.stringify(data)
    const dataURL = await QRCode.toDataURL(jsonData, {
      errorCorrectionLevel: 'M', // Medium error correction
      width: 128,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return dataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Return empty data URL as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

/**
 * Get QR code data for a sale
 */
export function getQRCodeData(saleData: SaleData): QRCodeData {
  return {
    type: 'sale',
    saleNumber: saleData.sale_number,
    saleId: saleData.id,
    total: saleData.total,
    date: saleData.created_at,
  }
}

/**
 * Get placeholder logo as base64 SVG data URL
 * This is a simple placeholder that can be replaced with actual logo
 */
export function getPlaceholderLogo(): string {
  const svg = `
    <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" fill="#f0f0f0" rx="8"/>
      <circle cx="60" cy="45" r="20" fill="#4a5568"/>
      <rect x="35" y="75" width="50" height="8" fill="#4a5568" rx="4"/>
      <rect x="25" y="90" width="70" height="6" fill="#cbd5e0" rx="3"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Format date for receipt
 */
export function formatReceiptDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile: 'Paiement mobile',
    other: 'Autre',
  }
  return methods[method] || method
}

/**
 * Format currency (reuse existing utility if possible)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
