import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/actions/products'
import { ProductsClient } from '@/components/products/products-client'

// Disable caching for role checks
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user!.id)
    .single()

  // Only admin and manager can access products
  if (!['admin', 'manager'].includes(profile?.role || '')) {
    redirect('/dashboard')
  }

  // Fetch all products - filtering/sorting handled client-side by DataTable
  const productsResult = await getProducts({})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your inventory and products
          </p>
        </div>
      </div>

      <ProductsClient products={productsResult.data || []} />
    </div>
  )
}
