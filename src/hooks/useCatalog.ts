import { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import { useCartStore } from '../store/cartStore';
import { fuzzyMatch } from '../utils/searchUtils';
import type { Product } from '../services/ProductService';

export const useCatalog = () => {
  const { products, categories, loading } = useProductContext();
  const searchQuery = useCartStore((state) => state.searchQuery);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500000,
    stockStatus: '' as 'disponible' | 'bajo' | 'agotado' | '',
    selectedTags: [] as string[],
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory
        ? p.fk_cod_cat === selectedCategory || Boolean(p.fk_cod_cats?.includes(selectedCategory))
        : true;
      const matchesSearch = fuzzyMatch(p.nom_prod, searchQuery);
      
      const price = p.precio_prod;
      const matchesPrice = price >= filters.minPrice && price <= filters.maxPrice;
      
      const stock = p.stock_actual || 0;
      const isLow = stock <= (p.stock_minimo || 0) && stock > 0;
      const matchesStock = 
        filters.stockStatus === '' ? true :
        filters.stockStatus === 'disponible' ? stock > (p.stock_minimo || 0) :
        filters.stockStatus === 'bajo' ? isLow :
        filters.stockStatus === 'agotado' ? stock === 0 : true;

      const matchesTags = filters.selectedTags.length === 0 
        ? true 
        : filters.selectedTags.every(t => p.tipos_prod?.includes(t));

      return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesTags;
    });
  }, [products, selectedCategory, searchQuery, filters]);

  const resetFilters = () => {
    setFilters({ minPrice: 0, maxPrice: 500000, stockStatus: '', selectedTags: [] });
    setSelectedCategory(null);
    useCartStore.getState().setSearchQuery('');
  };

  return {
    products: filteredProducts,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedProduct,
    setSelectedProduct,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    resetFilters,
  };
};
