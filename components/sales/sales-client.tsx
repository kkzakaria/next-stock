'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SalesFilters } from './sales-filters'
import { SalesPagination } from './sales-pagination'
import { SalesDataTable } from './sales-data-table'
import { useSaleFilters } from '@/lib/hooks/use-sale-filters'
import { getSales, type SaleWithDetails } from '@/lib/actions/sales'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Store {
  id: string
  name: string
}

interface SalesClientProps {
  stores: Store[]
  userStoreId?: string | null
  userRole: 'admin' | 'manager' | 'cashier'
}

export function SalesClient({ stores, userStoreId, userRole }: SalesClientProps) {
  const { filters } = useSaleFilters()
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Debounce timer ref for realtime updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / filters.limit)

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getSales({
        search: filters.search,
        status: filters.status as 'completed' | 'refunded' | 'pending' | null,
        store: filters.store,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy as 'created_at' | 'total_amount' | 'invoice_number',
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      })

      if (result.success && result.data) {
        setSales(result.data.sales)
        setTotalCount(result.data.pagination.total)
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
  }, [filters])

  // Fetch sales when filters change
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
          // Add new sale to the list if on first page
          if (filters.page === 1) {
            debouncedRefresh()
          }
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
  }, [supabase, userStoreId, userRole, filters.page, fetchSales])

  // Handle refresh after refund
  const handleRefresh = useCallback(() => {
    fetchSales()
  }, [fetchSales])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <SalesFilters stores={stores} />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <>
              Showing {sales.length} of {totalCount} sales
            </>
          )}
        </div>
      </div>

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
        pageCount={totalPages}
        pageSize={filters.limit}
        onRefresh={handleRefresh}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <SalesPagination currentPage={filters.page} totalPages={totalPages} />
      )}
    </div>
  )
}
