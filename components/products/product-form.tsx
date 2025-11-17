/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporary: zod v4 compatibility with react-hook-form
'use client'

import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { AlertCircle } from 'lucide-react'

const productFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().nullable(),
  price: z.string().min(0, 'Price must be positive'),
  cost: z.string().optional(),
  quantity: z.string().min(0, 'Quantity must be non-negative'),
  min_stock_level: z.string().min(0, 'Min stock level must be non-negative'),
  store_id: z.string().uuid('Invalid store'),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  barcode: z.string().optional(),
  is_active: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductData {
  id?: string
  sku: string
  name: string
  description?: string | null
  category_id?: string | null
  price: number
  cost?: number | null
  quantity: number
  min_stock_level?: number | null
  store_id: string | null
  image_url?: string | null
  barcode?: string | null
  is_active?: boolean | null
}

interface ProductFormProps {
  initialData?: ProductData
  categories: Array<{ id: string; name: string }>
  stores: Array<{ id: string; name: string }>
  userRole: string
  userStoreId: string | null
}

export function ProductForm({
  initialData,
  categories,
  stores,
  userRole,
  userStoreId,
}: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialData

  const form = useForm<ProductFormValues>({
    // @ts-expect-error - Zod v4 compatibility issue with @hookform/resolvers
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          sku: initialData.sku,
          name: initialData.name,
          description: initialData.description || '',
          category_id: initialData.category_id || '',
          price: initialData.price?.toString() || '0',
          cost: initialData.cost?.toString() || '',
          quantity: initialData.quantity?.toString() || '0',
          min_stock_level: initialData.min_stock_level?.toString() || '10',
          store_id: initialData.store_id,
          image_url: initialData.image_url || '',
          barcode: initialData.barcode || '',
          is_active: initialData.is_active ?? true,
        }
      : {
          sku: '',
          name: '',
          description: '',
          category_id: '',
          price: '0',
          cost: '',
          quantity: '0',
          min_stock_level: '10',
          store_id: userStoreId || '',
          image_url: '',
          barcode: '',
          is_active: true,
        },
  })

  const onSubmit = (data: ProductFormValues) => {
    setError(null)
    startTransition(async () => {
      // Convert string values to numbers
      const productData = {
        ...data,
        price: parseFloat(data.price),
        cost: data.cost ? parseFloat(data.cost) : undefined,
        quantity: parseInt(data.quantity, 10),
        min_stock_level: parseInt(data.min_stock_level, 10),
        category_id: data.category_id || null,
      }

      const result = isEditing
        ? await updateProduct(initialData.id, productData)
        : await createProduct(productData)

      if (result.success) {
        router.push('/products')
        router.refresh()
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="PROD-001" {...field} />
                    </FormControl>
                    <FormDescription>Unique product identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Customer-facing price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Internal cost</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Current stock level</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Level *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>Low stock alert threshold</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={userRole !== 'admin'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userRole !== 'admin' && (
                    <FormDescription>
                      Managers can only create products for their assigned store
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
