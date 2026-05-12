/**
 * useTracking.ts — Hook de inicialização global de tracking
 * 
 * Deve ser chamado UMA VEZ no componente raiz (App.tsx).
 * 
 * Responsabilidades:
 * 1. Captura UTMs da URL no mount
 * 2. Dispara PageView no Meta Pixel
 * 3. Registra landing page no sessionStorage
 * 
 * ⚠️ Usa firedRef para prevenir double-fire do StrictMode.
 */

import { useEffect, useRef } from 'react';
import { captureUtmParams, getSessionId, firePixelEvent, getDeviceType } from '../lib/tracking';

export function useTracking(): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // 1. Captura e persiste UTMs da URL atual
    const utms = captureUtmParams();

    // 2. Gera Session ID (persiste em sessionStorage)
    const sessionId = getSessionId();

    // 3. Dispara PageView no Meta Pixel
    firePixelEvent('PageView');

    // 4. Log de debug (desativado em produção)
    if (import.meta.env.DEV) {
      console.log('[Tracking] Session:', sessionId);
      console.log('[Tracking] UTMs:', utms);
      console.log('[Tracking] Device:', getDeviceType());
    }
  }, []);
}
