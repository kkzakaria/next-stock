'use client';

import { ProductsDataTable } from './products-data-table';
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

interface ProductsClientProps {
  products: Product[];
}

export function ProductsClient({ products }: ProductsClientProps) {
  const router = useRouter();

  const handleAddProduct = () => {
    router.push('/products/new');
  };

  return (
    <ProductsDataTable products={products} onAddProduct={handleAddProduct} />
  );
}
