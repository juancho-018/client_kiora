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
    selectedCategories: [] as number[],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesCategory = selectedCategory
        ? p.fk_cod_cat === selectedCategory || Boolean(p.fk_cod_cats?.includes(selectedCategory))
        : true;
      const matchesSearch = fuzzyMatch(p.nom_prod, searchQuery);
      
      const stock = p.stock_actual || 0;

      const price = p.precio_prod * (1 - (p.descuento || 0) / 100);
      const matchesPrice = price >= filters.minPrice && price <= filters.maxPrice;
      
      const isLow = stock <= (p.stock_minimo || 0) && stock > 0;
      const matchesStock = 
        filters.stockStatus === '' ? true :
        filters.stockStatus === 'disponible' ? stock > (p.stock_minimo || 0) :
        filters.stockStatus === 'bajo' ? isLow :
        filters.stockStatus === 'agotado' ? stock === 0 : true;

      const matchesFilterCategories = filters.selectedCategories.length === 0 
        ? true 
        : filters.selectedCategories.some(catId => p.fk_cod_cat === catId || Boolean(p.fk_cod_cats?.includes(catId)));

      return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesFilterCategories;
    });

    // Ordenar: Disponibles primero, agotados de último
    return filtered.sort((a, b) => {
      const aAgotado = (a.stock_actual || 0) <= 0;
      const bAgotado = (b.stock_actual || 0) <= 0;
      if (aAgotado && !bAgotado) return 1;
      if (!aAgotado && bAgotado) return -1;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, filters]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, filters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const resetFilters = () => {
    setFilters({ minPrice: 0, maxPrice: 500000, stockStatus: '', selectedCategories: [] });
    setSelectedCategory(null);
    setCurrentPage(1);
    useCartStore.getState().setSearchQuery('');
  };

  return {
    products: paginatedProducts,
    totalProducts: filteredProducts.length,
    currentPage,
    setCurrentPage,
    totalPages,
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
