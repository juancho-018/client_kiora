/**
 * Base del API Gateway en el navegador.
 *
 * - Por defecto `/api`: las peticiones van al mismo host/puerto que la app; en `astro dev`
 *   el proxy de `astro.config.mjs` reenvía a `localhost:3000`.
 * - En Docker/nginx, haz proxy de `/api` y `/uploads` al gateway (ver nginx.conf).
 * - Si necesitas URL absoluta (p. ej. otro dominio): PUBLIC_API_URL=https://api.tu-dominio.com/api
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.PUBLIC_API_URL;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return '/api';
  }
  return String(raw).trim().replace(/\/$/, '') || '/api';
}
