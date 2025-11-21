/**
 * TypeScript types for POS PDF generation
 */

import { PageFormat } from '@/lib/pos/pdf-formats'

/**
 * Sale data structure for PDF receipt
 * Matches the structure from pos-receipt.tsx
 */
export interface SaleData {
  id: string
  sale_number: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string
  created_at: string
  notes: string | null
  store: {
    name: string
    address: string | null
    phone: string | null
  }
  cashier: {
    full_name: string
  }
  sale_items: Array<{
    quantity: number
    unit_price: number
    subtotal: number
    discount: number
    product: {
      name: string
      sku: string
    }
  }>
}

/**
 * PDF generation options
 */
export interface PDFOptions {
  format: PageFormat
  qrCodeDataURL: string
  logoDataURL?: string
}

/**
 * QR code data structure
 */
export interface QRCodeData {
  type: 'sale'
  saleNumber: string
  saleId: string
  total?: number
  date?: string
}

/**
 * Share options
 */
export interface ShareOptions {
  title?: string
  text?: string
}
