import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getProducts } from '@/lib/actions/products'
import { ProductsTable } from '@/components/products/products-table'

// Disable caching for role checks
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user!.id)
    .single()

  console.log('=== PRODUCTS PAGE DEBUG ===')
  console.log('User ID:', user!.id)
  console.log('Profile data:', profile)
  console.log('Profile error:', profileError)
  console.log('Role check result:', ['admin', 'manager'].includes(profile?.role || ''))
  console.log('========================')

  // Only admin and manager can access products
  if (!['admin', 'manager'].includes(profile?.role || '')) {
    console.log('REDIRECTING TO DASHBOARD - Role:', profile?.role)
    redirect('/dashboard')
  }

  // Fetch products
  const { data: products } = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your inventory and products
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsTable products={products || []} />
    </div>
  )
}
