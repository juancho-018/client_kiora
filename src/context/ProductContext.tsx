import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProductService, type Product, type Category } from '../services/ProductService';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  refreshData: (isBackground?: boolean) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        ProductService.getProducts(),
        ProductService.getCategories(),
      ]);
      setProducts(prodRes);
      setCategories(catRes);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <ProductContext.Provider value={{ products, categories, loading, refreshData: fetchData }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProductContext must be used within a ProductProvider');
  return context;
};
