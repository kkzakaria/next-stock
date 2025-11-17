'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema for product creation/update
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().uuid('Invalid category').nullable(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  min_stock_level: z.number().int().min(0, 'Min stock level must be non-negative').default(10),
  store_id: z.string().uuid('Invalid store'),
  image_url: z.string().url().optional().or(z.literal('')),
  barcode: z.string().optional(),
  is_active: z.boolean().default(true),
})

type ProductInput = z.infer<typeof productSchema>

interface ActionResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Create a new product
 */
export async function createProduct(data: ProductInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verify user has permission (admin or manager)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Managers can only create products for their store
    if (profile.role === 'manager' && data.store_id !== profile.store_id) {
      return { success: false, error: 'You can only create products for your assigned store' }
    }

    // Validate input
    const validated = productSchema.parse(data)

    // Check for duplicate SKU
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', validated.sku)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Product with this SKU already exists' }
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert(validated)
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Product creation error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create product' }
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: Partial<ProductInput>): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verify user has permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get existing product
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      return { success: false, error: 'Product not found' }
    }

    // Managers can only update products in their store
    if (profile.role === 'manager' && existing.store_id !== profile.store_id) {
      return { success: false, error: 'You can only update products in your assigned store' }
    }

    // Check for duplicate SKU if SKU is being changed
    if (data.sku && data.sku !== existing.sku) {
      const { data: duplicate } = await supabase
        .from('products')
        .select('id')
        .eq('sku', data.sku)
        .neq('id', id)
        .maybeSingle()

      if (duplicate) {
        return { success: false, error: 'Product with this SKU already exists' }
      }
    }

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, data: product }
  } catch (error) {
    console.error('Product update error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update product' }
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verify user has permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get existing product
    const { data: existing } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return { success: false, error: 'Product not found' }
    }

    // Managers can only delete products in their store
    if (profile.role === 'manager' && existing.store_id !== profile.store_id) {
      return { success: false, error: 'You can only delete products in your assigned store' }
    }

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    console.error('Product deletion error:', error)
    return { success: false, error: 'Failed to delete product' }
  }
}

/**
 * Get all products for the current user's store(s)
 */
export async function getProducts(storeId?: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Profile not found', data: [] }
    }

    // Build query based on role and store filter
    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        ),
        stores (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply store filter based on role
    if (profile.role !== 'admin') {
      query = query.eq('store_id', profile.store_id)
    } else if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: products || [] }
  } catch (error) {
    console.error('Get products error:', error)
    return { success: false, error: 'Failed to fetch products', data: [] }
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Profile not found', data: null }
    }

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        ),
        stores (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return { success: false, error: error.message, data: null }
    }

    // Verify access based on role
    if (profile.role !== 'admin' && product.store_id !== profile.store_id) {
      return { success: false, error: 'Insufficient permissions', data: null }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error('Get product error:', error)
    return { success: false, error: 'Failed to fetch product', data: null }
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(id: string, isActive: boolean): Promise<ActionResult> {
  return updateProduct(id, { is_active: isActive })
}

/**
 * Update product quantity (creates stock movement automatically via trigger)
 */
export async function updateProductQuantity(
  id: string,
  newQuantity: number
): Promise<ActionResult> {
  return updateProduct(id, { quantity: newQuantity })
}
