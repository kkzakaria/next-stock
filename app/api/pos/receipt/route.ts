/**
 * API Route for PDF Receipt Generation
 * Generates PDF server-side to avoid client performance issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { POSReceiptPDF } from '@/components/pos/pos-receipt-pdf'
import { generateQRCode, getQRCodeData, getPlaceholderLogo } from '@/lib/pos/pdf-utils'
import type { SaleData } from '@/types/pos-pdf'
import type { PageFormat } from '@/lib/pos/pdf-formats'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const saleId = searchParams.get('saleId')
    const format = (searchParams.get('format') || 'THERMAL_80MM') as PageFormat

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }

    // Fetch sale data
    const supabase = await createClient()
    const { data: saleData, error: dbError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        subtotal,
        tax,
        discount,
        total,
        payment_method,
        created_at,
        notes,
        store:stores(name, address, phone),
        cashier:profiles!sales_cashier_id_fkey(full_name),
        sale_items(
          quantity,
          unit_price,
          subtotal,
          discount,
          product:product_templates(name, sku)
        )
      `)
      .eq('id', saleId)
      .single()

    if (dbError || !saleData) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Generate QR code
    const qrData = getQRCodeData(saleData as unknown as SaleData)
    const qrCodeDataURL = await generateQRCode(qrData)
    const logoDataURL = getPlaceholderLogo()

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      POSReceiptPDF({
        saleData: saleData as unknown as SaleData,
        options: {
          format,
          qrCodeDataURL,
          logoDataURL,
        },
      })
    )

    // Return PDF (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${saleData.sale_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
