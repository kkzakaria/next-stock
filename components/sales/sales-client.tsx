'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SalesDataTable } from './sales-data-table'
import { getSales, type SaleWithDetails } from '@/lib/actions/sales'
import { toast } from 'sonner'

interface SalesClientProps {
  userStoreId?: string | null
  userRole: 'admin' | 'manager' | 'cashier'
}

export function SalesClient({ userStoreId, userRole }: SalesClientProps) {
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Debounce timer ref for realtime updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getSales({
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: 1,
        limit: 1000, // Fetch all for client-side filtering
      })

      if (result.success && result.data) {
        setSales(result.data.sales)
      } else {
        setError(result.error || 'Failed to load sales')
        toast.error(result.error || 'Failed to load sales')
      }
    } catch (err) {
      console.error('Error fetching sales:', err)
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch sales on mount
  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  // Real-time subscription for sales updates
  useEffect(() => {
    // Debounced refresh function
    const debouncedRefresh = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchSales()
      }, 500) // 500ms delay to batch multiple changes
    }

    // Determine which store(s) to subscribe to
    const storeFilter = userRole === 'manager' && userStoreId
      ? `store_id=eq.${userStoreId}`
      : undefined

    // Subscribe to sales changes
    const channel = supabase
      .channel('sales-realtime')
      // Broadcast for local dev
      .on(
        'broadcast',
        { event: 'sale_created' },
        () => {
          debouncedRefresh()
        }
      )
      // Postgres changes for production
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: storeFilter,
        },
        () => {
          debouncedRefresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales',
          filter: storeFilter,
        },
        (payload) => {
          // Update sale in the list
          setSales(prev =>
            prev.map(sale =>
              sale.id === payload.new.id
                ? { ...sale, ...payload.new }
                : sale
            )
          )
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [supabase, userStoreId, userRole, fetchSales])

  // Handle refresh after refund
  const handleRefresh = useCallback(() => {
    fetchSales()
  }, [fetchSales])

  return (
    <div className="space-y-4">
      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Sales Table */}
      <SalesDataTable
        sales={sales}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
