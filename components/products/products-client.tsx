'use client';

import { ProductsDataTable } from './products-data-table';
import { ProductsFilters } from './products-filters';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  quantity: number;
  min_stock_level: number | null;
  is_active: boolean | null;
  barcode: string | null;
  categories: { id: string; name: string } | null;
  stores: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
}

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  stores: Store[];
  totalCount: number;
}

export function ProductsClient({
  products,
  categories,
  stores,
}: ProductsClientProps) {
  const router = useRouter();

  const handleAddProduct = () => {
    router.push('/products/new');
  };

  return (
    <div className="space-y-6">
      {/* Filters - Keep for server-side filtering */}
      <ProductsFilters categories={categories} stores={stores} />

      {/* Products DataTable with client-side features */}
      <ProductsDataTable
        products={products}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}
