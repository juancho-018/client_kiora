import { getApiBase } from './apiBase';

/**
 * URL para imágenes del API (uploads). Con PUBLIC_API_URL=/api las rutas son relativas al sitio.
 */
export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;

  const apiBase = getApiBase();
  const IMG_BASE = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : '';

  const cleanBase = IMG_BASE.endsWith('/') ? IMG_BASE.slice(0, -1) : IMG_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
