/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Misma base que PROYECTO_KIORAPP: p. ej. /api (con proxy) o http://…/api */
  readonly PUBLIC_API_URL?: string;
  /** Debe coincidir con KIOSK_API_KEY del API Gateway (pedidos del kiosco). */
  readonly PUBLIC_KIOSK_API_KEY?: string;
  /** Weglot (opcional). */
  readonly PUBLIC_WEGLOT_API_KEY?: string;
  /** Sentry DSN público (opcional; alinear con el panel). */
  readonly PUBLIC_SENTRY_DSN?: string;
  /**
   * Solo entorno de build / CI para Sentry (source maps). No es PUBLIC_*;
   * no se expone al bundle del cliente.
   */
  readonly SENTRY_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
