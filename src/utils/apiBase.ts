/**
 * Base URL del API Gateway en el cliente.
 *
 * - Build de producción + `/api`: mismo origen (Nginx / CDN con proxy).
 * - `npm run dev` en localhost: llamada **directa** a `http://localhost:3000/api`
 *   para no depender del proxy de Vite (evita respuestas tipo "Cannot GET /").
 *
 * `PUBLIC_API_URL` absoluto en producción real (otro dominio) se respeta.
 */

const LOCAL_GATEWAY_API = 'http://localhost:3000/api';

function shouldUseRelativeLocalApi(apiBase: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!apiBase.startsWith('http')) return false;
  try {
    const u = new URL(apiBase);
    const isLocal = (host: string) => host === 'localhost' || host === '127.0.0.1';
    if (!isLocal(window.location.hostname) || !isLocal(u.hostname)) return false;
    return u.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function getApiBase(): string {
  const raw = import.meta.env.PUBLIC_API_URL?.trim();
  const base = raw ? raw.replace(/\/$/, '') : '/api';

  // Solo en desarrollo Vite (HMR): gateway directo + CORS ampliado en api-gateway.
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      const isCustomRemote = raw && !raw.includes('localhost') && !raw.includes('127.0.0.1');
      if (!isCustomRemote) {
        return LOCAL_GATEWAY_API;
      }
    }
  }

  if (base === '/api') return '/api';
  if (shouldUseRelativeLocalApi(base)) return '/api';
  return base;
}

/** Catálogo público sin JWT: GET …/public/products */
export function getPublicCatalogBase(): string {
  return `${getApiBase()}/public`;
}
