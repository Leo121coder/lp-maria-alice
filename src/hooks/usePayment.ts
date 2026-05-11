/**
 * usePayment.ts — Hook central de pagamento PIX
 * 
 * Gerencia todo o fluxo: criar PIX → polling com backoff → confirmação.
 * Usa o PaymentFactory para instanciar o gateway ativo.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createGateway } from '../gateways';
import type { CreatePixResponse, PaymentStatus, DonorInfo } from '../gateways';

/** Configuração do gateway ativo — vem do .env via config.ts */
function getActiveGateway() {
  return createGateway('sagacepay', {
    name: 'sagacepay',
    apiKey: import.meta.env.VITE_GATEWAY_API_KEY || '',
    apiUrl: import.meta.env.VITE_GATEWAY_API_URL || 'https://pixnerva.com.br/api',
  });
}

interface UsePaymentReturn {
  /** Status atual do pagamento */
  status: 'idle' | 'loading' | 'ready' | 'polling' | 'paid' | 'expired' | 'error';
  /** Dados do PIX gerado */
  pixData: CreatePixResponse | null;
  /** Mensagem de erro, se houver */
  errorMessage: string;
  /** Tempo restante (segundos) para expiração */
  timeLeft: number;
  /** Gera um novo PIX */
  createPix: (amount: number, donor: DonorInfo, tracking?: CreatePixResponse['tracking']) => Promise<void>;
  /** Para o polling e reseta */
  reset: () => void;
}

/** Intervalo inicial de polling (4s) */
const POLL_INITIAL_MS = 4000;
/** Intervalo máximo de polling (20s) */
const POLL_MAX_MS = 20000;
/** Fator de multiplicação do backoff */
const POLL_BACKOFF = 1.4;
/** Tempo de expiração do PIX (30 min) */
const PIX_EXPIRATION_SECS = 1800;

export function usePayment(): UsePaymentReturn {
  const [status, setStatus] = useState<UsePaymentReturn['status']>('idle');
  const [pixData, setPixData] = useState<CreatePixResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(PIX_EXPIRATION_SECS);

  const pollTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef(POLL_INITIAL_MS);
  const timerRef = useRef<number | null>(null);
  const saleIdRef = useRef<string>('');
  const isPollingRef = useRef(false);

  /** Limpa todos os timers */
  const clearTimers = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  /** Reseta o estado completo */
  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setPixData(null);
    setErrorMessage('');
    setTimeLeft(PIX_EXPIRATION_SECS);
    pollIntervalRef.current = POLL_INITIAL_MS;
    saleIdRef.current = '';
  }, [clearTimers]);

  /** Polling com exponential backoff */
  const pollStatus = useCallback(async () => {
    if (!isPollingRef.current || !saleIdRef.current) return;

    try {
      const gateway = getActiveGateway();
      const result = await gateway.checkStatus(saleIdRef.current);

      if (result.status === 'paid') {
        clearTimers();
        setStatus('paid');

        // Meta Pixel — Purchase event no frontend (tracking server-side é feito pelo SagacePay via CAPI)
        if (typeof (window as Record<string, unknown>).fbq === 'function') {
          (window as Record<string, unknown> & { fbq: (...args: unknown[]) => void }).fbq(
            'track', 'Purchase', { value: result.amount, currency: 'BRL' }
          );
        }
        return;
      }

      if (result.status === 'expired' || result.status === 'failed') {
        clearTimers();
        setStatus('expired');
        return;
      }

      // Agendar próximo poll com backoff
      pollIntervalRef.current = Math.min(
        pollIntervalRef.current * POLL_BACKOFF,
        POLL_MAX_MS
      );
      pollTimeoutRef.current = window.setTimeout(pollStatus, pollIntervalRef.current);
    } catch {
      // Em caso de erro de rede, tenta novamente (sem parar)
      pollTimeoutRef.current = window.setTimeout(pollStatus, pollIntervalRef.current);
    }
  }, [clearTimers]);

  /** Inicia o countdown timer (30 min) */
  const startCountdown = useCallback(() => {
    setTimeLeft(PIX_EXPIRATION_SECS);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimers();
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers]);

  /** Cria um novo PIX */
  const createPix = useCallback(async (
    amount: number,
    donor: DonorInfo,
    tracking?: Record<string, string>
  ) => {
    clearTimers();
    setStatus('loading');
    setErrorMessage('');

    try {
      const gateway = getActiveGateway();
      const idempotencyKey = `donation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const result = await gateway.createPix({
        amount,
        description: `Doação para Maria Alice - R$ ${amount.toFixed(2)}`,
        donor,
        idempotencyKey,
        tracking,
      });

      if (!result.success) {
        setStatus('error');
        setErrorMessage(result.error || 'Erro ao gerar PIX');
        return;
      }

      setPixData(result);
      saleIdRef.current = result.saleId;
      setStatus('ready');

      // Inicia countdown e polling
      startCountdown();
      isPollingRef.current = true;
      pollIntervalRef.current = POLL_INITIAL_MS;
      pollTimeoutRef.current = window.setTimeout(pollStatus, POLL_INITIAL_MS);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado');
    }
  }, [clearTimers, startCountdown, pollStatus]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return { status, pixData, errorMessage, timeLeft, createPix, reset };
}
