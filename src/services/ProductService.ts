export interface Product {
  cod_prod: number;
  nom_prod: string;
  desc_prod: string;
  precio_prod: number;
  imagen_prod: string;
  fk_cod_cat: number;
  stock_actual: number;
  stock_minimo: number;
  tipos_prod: string[];
  categoria?: {
    nom_cat: string;
  };
}

export interface Category {
  cod_cat: number;
  nom_cat: string;
  desc_cat: string;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    try {
      const resp = await fetch(`${API_BASE_URL}/products`);
      if (!resp.ok) return [];
      const json = await resp.json();
      const data = json.data || [];
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getCategories(): Promise<Category[]> {
    try {
      const resp = await fetch(`${API_BASE_URL}/categories`);
      if (!resp.ok) return [];
      const json = await resp.json();
      const data = json.data || [];
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}
