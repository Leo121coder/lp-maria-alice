/**
 * lib/tracking.ts — Sistema de Tracking Inteligente
 * 
 * Baseado nos módulos RiseDev validados:
 * - lib-tracking-event-id-session-scoped (Session ID)
 * - analytics-hybrid-visitor-hash (Visitor Hash)
 * - tracking-deterministic-event-ids (Event IDs)
 * 
 * Responsabilidades:
 * 1. Gerar e persistir Session ID (UUID v4 em sessionStorage)
 * 2. Capturar e persistir UTMs da URL (localStorage com expiração)
 * 3. Ler cookies _fbp/_fbc do Meta Pixel
 * 4. Detectar device type
 * 5. Montar payload completo de tracking para enviar com cada PIX
 * 
 * ⚠️ SEGURANÇA: Nenhum dado sensível é coletado.
 *    Apenas parâmetros de marketing e identificadores anônimos.
 */

import { CONFIG } from '../config';

// ─── Types ───────────────────────────────────────────────

export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  src: string;
  sck: string;
}

export interface TrackingPayload {
  sessionId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  device: 'mobile' | 'desktop';
  clientUserAgent: string;
  referrer: string;
  landingPage: string;
}

// ─── Constants ───────────────────────────────────────────

const SESSION_ID_KEY = 'donation_session_id';
const UTM_STORAGE_KEY = CONFIG.UTM_STORAGE_KEY || 'utm_params';
const UTM_TIMESTAMP_KEY = 'utm_params_ts';
const UTM_EXPIRY_MS = (CONFIG.UTM_EXPIRY_HOURS || 24) * 60 * 60 * 1000;
const LANDING_PAGE_KEY = 'landing_page';

/**
 * Lista de parâmetros UTM capturados da URL.
 * Inclui padrões do Google Ads, Facebook Ads e UTMify.
 */
const UTM_KEYS: (keyof UtmParams)[] = [
  'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'utm_term', 'fbclid', 'src', 'sck',
];

// ─── Session ID ──────────────────────────────────────────

/**
 * Gera ou recupera um Session ID único por visita.
 * Usa sessionStorage (morre ao fechar a aba).
 * Fallback para ID efêmero se sessionStorage indisponível (aba anônima).
 * 
 * Padrão RiseDev: lib-tracking-event-id-session-scoped
 */
export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const newId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch {
    // sessionStorage indisponível (navegação privada em alguns browsers)
    return generateUUID();
  }
}

// ─── UTM Capture ─────────────────────────────────────────

/**
 * Captura parâmetros UTM da URL atual e persiste em localStorage.
 * 
 * Regras:
 * - Só sobrescreve se houver novos UTMs na URL (first-touch preservado)
 * - Expira após CONFIG.UTM_EXPIRY_HOURS (padrão: 24h)
 * - Se não há UTMs na URL, retorna os persistidos ou defaults
 */
export function captureUtmParams(): UtmParams {
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl: Partial<UtmParams> = {};
  let hasNewUtms = false;

  for (const key of UTM_KEYS) {
    const value = urlParams.get(key);
    if (value) {
      fromUrl[key] = value;
      hasNewUtms = true;
    }
  }

  // Se tem novos UTMs na URL, persiste (sobrescreve)
  if (hasNewUtms) {
    const merged = { ...getPersistedUtms(), ...fromUrl };
    persistUtms(merged as UtmParams);

    // Salva landing page na primeira visita com UTM
    if (!sessionStorage.getItem(LANDING_PAGE_KEY)) {
      sessionStorage.setItem(LANDING_PAGE_KEY, window.location.href);
    }

    return merged as UtmParams;
  }

  // Sem novos UTMs — retorna persistidos ou defaults
  return getPersistedUtms();
}

/**
 * Recupera UTMs do localStorage (se não expirados).
 */
function getPersistedUtms(): UtmParams {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    const ts = localStorage.getItem(UTM_TIMESTAMP_KEY);

    if (raw && ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed < UTM_EXPIRY_MS) {
        return JSON.parse(raw) as UtmParams;
      }
      // Expirou — limpa
      localStorage.removeItem(UTM_STORAGE_KEY);
      localStorage.removeItem(UTM_TIMESTAMP_KEY);
    }
  } catch {
    // localStorage indisponível
  }

  // Defaults do CONFIG
  return {
    utm_source: CONFIG.UTM_DEFAULTS.utm_source,
    utm_medium: CONFIG.UTM_DEFAULTS.utm_medium,
    utm_campaign: CONFIG.UTM_DEFAULTS.utm_campaign,
    utm_content: CONFIG.UTM_DEFAULTS.utm_content,
    utm_term: '',
    fbclid: '',
    src: '',
    sck: '',
  };
}

/**
 * Persiste UTMs no localStorage com timestamp.
 */
function persistUtms(params: UtmParams): void {
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    localStorage.setItem(UTM_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // localStorage indisponível
  }
}

// ─── Meta Pixel Cookies ─────────────────────────────────

/**
 * Lê cookies _fbp e _fbc do Meta Pixel (se presente).
 * _fbp = Facebook Browser ID (persistente)
 * _fbc = Facebook Click ID (vem do fbclid na URL)
 */
export function getFbCookies(): { fbp?: string; fbc?: string } {
  const cookies = document.cookie.split(';').reduce<Record<string, string>>((acc, c) => {
    const [key, ...vals] = c.trim().split('=');
    if (key) acc[key] = vals.join('=');
    return acc;
  }, {});

  return {
    fbp: cookies['_fbp'] || undefined,
    fbc: cookies['_fbc'] || undefined,
  };
}

// ─── Device Detection ────────────────────────────────────

/**
 * Detecta tipo de dispositivo via User Agent.
 */
export function getDeviceType(): 'mobile' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'opera mini', 'iemobile'];
  return mobileKeywords.some(k => ua.includes(k)) ? 'mobile' : 'desktop';
}

// ─── Tracking Payload Builder ────────────────────────────

/**
 * Monta o payload completo de tracking para enviar com cada PIX.
 * Este é o "pacote de inteligência" que acompanha cada doação.
 */
export function getTrackingPayload(): TrackingPayload {
  const utms = captureUtmParams();
  const fb = getFbCookies();

  return {
    sessionId: getSessionId(),
    utmSource: utms.utm_source || undefined,
    utmMedium: utms.utm_medium || undefined,
    utmCampaign: utms.utm_campaign || undefined,
    utmContent: utms.utm_content || undefined,
    utmTerm: utms.utm_term || undefined,
    fbclid: utms.fbclid || undefined,
    fbp: fb.fbp,
    fbc: fb.fbc,
    device: getDeviceType(),
    clientUserAgent: navigator.userAgent,
    referrer: document.referrer || '',
    landingPage: sessionStorage.getItem(LANDING_PAGE_KEY) || window.location.href,
  };
}

// ─── Meta Pixel Helpers ──────────────────────────────────

type FbqFunction = (...args: unknown[]) => void;

/**
 * Dispara evento no Meta Pixel (se carregado).
 * Fail-safe: nunca lança erro se o Pixel não estiver presente.
 */
export function firePixelEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  try {
    const w = window as unknown as { fbq?: FbqFunction };
    if (typeof w.fbq === 'function') {
      w.fbq('track', eventName, params);
    }
  } catch {
    // Pixel não disponível — silencioso
  }
}

// ─── UUID Generator (sem dependência externa) ────────────

/**
 * Gera UUID v4 usando crypto.randomUUID (nativo) com fallback.
 * Evita instalar dependência `uuid` para um uso tão simples.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback para browsers antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
