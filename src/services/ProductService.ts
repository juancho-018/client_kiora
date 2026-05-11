/**
 * Catálogo público del kiosco: usa rutas /api/public/* del gateway (sin JWT).
 * Normaliza campos del microservicio de productos (precio_unitario, url_imagen, etc.).
 */

import { getPublicCatalogBase } from '../utils/apiBase';

export interface Product {
  cod_prod: number;
  nom_prod: string;
  desc_prod: string;
  precio_prod: number;
  imagen_prod: string;
  /** Primera categoría (filtros rápidos). */
  fk_cod_cat: number;
  /** Todas las categorías asignadas en admin (array Postgres). */
  fk_cod_cats?: number[];
  stock_actual: number;
  stock_minimo: number;
  tipos_prod: string[];
  fechaven_prod?: string | null;
  categoria?: { nom_cat: string };
}

export interface Category {
  cod_cat: number;
  nom_cat: string;
  desc_cat: string;
}

const publicPrefix = () => getPublicCatalogBase();

function normalizeProduct(raw: Record<string, unknown>): Product {
  const fkArr = Array.isArray(raw.fk_cod_cats)
    ? (raw.fk_cod_cats as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
    : [];
  const precio = Number(raw.precio_prod ?? raw.precio_unitario ?? 0);
  const img = String(raw.imagen_prod ?? raw.url_imagen ?? '');
  return {
    cod_prod: Number(raw.cod_prod),
    nom_prod: String(raw.nom_prod ?? ''),
    desc_prod: String(raw.desc_prod ?? raw.descrip_prod ?? ''),
    precio_prod: precio,
    imagen_prod: img,
    fk_cod_cat: fkArr[0] ?? Number(raw.fk_cod_cat) ?? 0,
    fk_cod_cats: fkArr.length ? fkArr : undefined,
    stock_actual: Number(raw.stock_actual ?? 0),
    stock_minimo: Number(raw.stock_minimo ?? 0),
    tipos_prod: Array.isArray(raw.tipos_prod) ? (raw.tipos_prod as string[]) : [],
    fechaven_prod: (raw.fechaven_prod as string) ?? null,
    categoria: raw.categoria as Product['categoria'],
  };
}

function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    cod_cat: Number(raw.cod_cat),
    nom_cat: String(raw.nom_cat ?? ''),
    desc_cat: String(raw.desc_cat ?? raw.descrip_cat ?? ''),
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export class ProductService {
  /**
   * Lista todos los productos activos (paginación automática).
   */
  static async getProducts(): Promise<Product[]> {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const all: Product[] = [];

    try {
      do {
        // WORKAROUND: Añadimos /api/products al final porque el API Gateway tiene
        // un bug en su pathRewrite que recorta la ruta base y envía lo que sobra tal cual.
        const url = `${publicPrefix()}/products/api/products?page=${page}&limit=${limit}`;
        const json = (await fetchJson(url)) as {
          data?: unknown[];
          pagination?: { totalPages?: number };
        };
        const rows = Array.isArray(json.data) ? json.data : [];
        for (const row of rows) {
          all.push(normalizeProduct(row as Record<string, unknown>));
        }
        totalPages = json.pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      return all;
    } catch (e) {
      console.error('[ProductService] getProducts:', e);
      return [];
    }
  }

  static async getCategories(): Promise<Category[]> {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const all: Category[] = [];

    try {
      do {
        // WORKAROUND: Añadimos /api/categories al final por el bug en el API Gateway.
        const url = `${publicPrefix()}/categories/api/categories?page=${page}&limit=${limit}`;
        const json = (await fetchJson(url)) as {
          data?: unknown[];
          pagination?: { totalPages?: number };
        };
        const rows = Array.isArray(json.data) ? json.data : [];
        for (const row of rows) {
          all.push(normalizeCategory(row as Record<string, unknown>));
        }
        totalPages = json.pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      return all;
    } catch (e) {
      console.error('[ProductService] getCategories:', e);
      return [];
    }
  }

  static async getProductById(id: number): Promise<Product | null> {
    try {
      const json = (await fetchJson(`${publicPrefix()}/products/api/products/${id}`)) as Record<string, unknown>;
      return normalizeProduct(json);
    } catch {
      return null;
    }
  }
}
