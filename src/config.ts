/**
 * config.ts — Configurações centralizadas
 * Única fonte de verdade para todas as constantes do projeto.
 * 
 * ⚠️ SEGURANÇA: Nenhum secret/apiKey deve existir aqui.
 *    A chave de API vive EXCLUSIVAMENTE no Supabase Secrets
 *    e é injetada pela Edge Function gateway-proxy.
 */

export const CONFIG = {
  /** Gateway de pagamento ativo — proxy seguro no Supabase */
  GATEWAY: {
    name: import.meta.env.VITE_GATEWAY_NAME || 'sagacepay',
    proxyUrl: 'https://jtltwmevurulsnfnctjq.supabase.co/functions/v1/gateway-proxy',
  },

  FB_PIXEL_ID: import.meta.env.VITE_FB_PIXEL_ID || '',
  CF_BEACON_TOKEN: import.meta.env.VITE_CF_BEACON_TOKEN || '',
  IMAGES_BASE: import.meta.env.VITE_IMAGES_BASE || 'https://ajudahumana.com/enzo4/images',

  CAMPAIGN: {
    name: 'Maria Alice',
    goal: 60000,
    raised: 7555.29,
    supporters: 243,
    city: 'Luziânia / GO',
    organizer: 'Maria Alice',
    organizerSince: 'outubro/2025',
  },

  UTM_DEFAULTS: {
    utm_source: 'mariaalice',
    utm_medium: 'web',
    utm_campaign: 'mariaalice',
    utm_content: 'site',
  },

  UTM_STORAGE_KEY: 'utm_params',
  UTM_EXPIRY_HOURS: 24,
  DEBUG: false,
  FAKE_DONATION_INTERVAL_MS: 30000,
  FAKE_DONATION_INITIAL_DELAY_MS: 5000,

  CROSS_SELL: {
    enabled: true,
    name: 'Bruno',
    age: '25 anos',
    description: 'Sofre com epidermolise bolhosa e precisa de curativos e tratamento continuo.',
    imageUrl: '../bruno/images/imm.svg',
    pageUrl: '../bruno/index.html',
  },
};

export function img(filename: string): string {
  return `${CONFIG.IMAGES_BASE}/${filename}`;
}
