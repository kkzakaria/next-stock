'use client'

/**
 * POS Receipt Component
 * Displays a printable receipt for completed sales
 */

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Printer, Download, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  saleNumber: string
}

interface SaleData {
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

export function POSReceipt({ open, onOpenChange, saleId, saleNumber }: ReceiptProps) {
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && saleId) {
      fetchSaleData()
    }
  }, [open, saleId])

  const fetchSaleData = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error } = await supabase
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

      if (error) throw error

      setSaleData(data as unknown as SaleData)
    } catch (err) {
      console.error('Error fetching sale data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      mobile: 'Mobile Payment',
      other: 'Other',
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !saleData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'Receipt not found'}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader>
          <DialogTitle className="print:hidden">Sale Receipt</DialogTitle>
          <DialogDescription className="print:hidden">Receipt #{saleNumber}</DialogDescription>
        </DialogHeader>

        {/* Receipt Content */}
        <div id="receipt-content" className="print:p-8">
          {/* Store Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold print:text-2xl">{saleData.store.name}</h2>
            {saleData.store.address && (
              <p className="text-sm text-gray-600">{saleData.store.address}</p>
            )}
            {saleData.store.phone && (
              <p className="text-sm text-gray-600">{saleData.store.phone}</p>
            )}
          </div>

          {/* Sale Info */}
          <div className="border-t border-b border-gray-300 py-4 mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Receipt #:</span>
              <span>{saleData.sale_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date:</span>
              <span>{formatDate(saleData.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Cashier:</span>
              <span>{saleData.cashier.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Payment:</span>
              <span>{formatPaymentMethod(saleData.payment_method)}</span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {saleData.sale_items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-500">{item.product.sku}</div>
                    </td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-2 font-medium">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(saleData.subtotal)}</span>
            </div>
            {saleData.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(saleData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (8.75%):</span>
              <span className="font-medium">{formatCurrency(saleData.tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
              <span>TOTAL:</span>
              <span>{formatCurrency(saleData.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {saleData.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold mb-1">Notes:</p>
              <p className="text-sm text-gray-600">{saleData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Thank you for your purchase!</p>
            <p className="text-xs mt-2">
              This is your official receipt. Please keep for your records.
            </p>
          </div>
        </div>

        {/* Action Buttons - Screen only */}
        <div className="flex gap-2 mt-4 print:hidden">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
