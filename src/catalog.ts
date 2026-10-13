import catalog from './garage-products.json';
export type ProductVariant = { id: string; label: string; image: string | null; status: 'catalog' | 'restock'; sourcePage: number; imageMethod: 'original' | 'crop' | 'pending' };
export type Product = { id: string; name: string; category: string; notes?: string; variants: ProductVariant[] };
export const products = catalog as Product[];
export const categories = [...new Set(products.map(product => product.category))];
export const findSelection = (productId: string, variantId: string) => {
  const product = products.find(item => item.id === productId);
  const variant = product?.variants.find(item => item.id === variantId);
  return product && variant ? { product, variant } : undefined;
};
