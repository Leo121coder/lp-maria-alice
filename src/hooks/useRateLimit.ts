/**
 * useRateLimit.ts — Rate Limiting de geração PIX por sessão
 * 
 * Baseado no módulo RiseDev validado: rate-limiting-service (score 100/100)
 * 
 * Regras:
 * - Cada visitante pode gerar até 5 PIX livremente
 * - Após 5, o botão é bloqueado por 10 minutos
 * - Após 10 minutos, o contador reseta para 5
 * - Persistência via sessionStorage (limpa ao fechar aba)
 * 
 * ⚠️ Este é o shield do FRONTEND. O backend (gateway-proxy)
 *    tem seu próprio rate limit por IP como segunda camada.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ───────────────────────────────────────────

const RATE_LIMIT_KEY = 'pix_rate_limit';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutos

// ─── Types ───────────────────────────────────────────────

interface RateLimitState {
  attempts: number;
  blockedUntil: number | null; // timestamp em ms
}

export interface UseRateLimitReturn {
  /** true se o visitante ainda pode gerar PIX */
  canGenerate: boolean;
  /** Tentativas restantes (5, 4, 3, 2, 1, 0) */
  attemptsLeft: number;
  /** Segundos restantes do bloqueio (0 se não bloqueado) */
  remainingSeconds: number;
  /** Registra +1 tentativa de geração */
  recordAttempt: () => void;
}

// ─── Storage Helpers ─────────────────────────────────────

function getState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw) as RateLimitState;
  } catch {
    // sessionStorage indisponível
  }
  return { attempts: 0, blockedUntil: null };
}

function saveState(state: RateLimitState): void {
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage indisponível
  }
}

// ─── Hook ────────────────────────────────────────────────

export function useRateLimit(): UseRateLimitReturn {
  const [state, setState] = useState<RateLimitState>(getState);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Calcula se o bloqueio expirou
  const isBlocked = state.blockedUntil !== null && Date.now() < state.blockedUntil;
  const attemptsLeft = isBlocked ? 0 : Math.max(0, MAX_ATTEMPTS - state.attempts);
  const canGenerate = attemptsLeft > 0;

  // Countdown timer para o bloqueio
  useEffect(() => {
    if (!isBlocked) {
      // Se bloqueio expirou, reseta o estado
      if (state.blockedUntil !== null && Date.now() >= state.blockedUntil) {
        const newState: RateLimitState = { attempts: 0, blockedUntil: null };
        setState(newState);
        saveState(newState);
        setRemainingSeconds(0);
      }
      return;
    }

    // Calcula segundos restantes
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((state.blockedUntil! - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        // Bloqueio expirou — reseta
        const newState: RateLimitState = { attempts: 0, blockedUntil: null };
        setState(newState);
        saveState(newState);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    updateRemaining();
    timerRef.current = window.setInterval(updateRemaining, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBlocked, state.blockedUntil]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Registra uma nova tentativa de geração de PIX */
  const recordAttempt = useCallback(() => {
    const current = getState();

    // Se estava bloqueado mas expirou, reseta
    if (current.blockedUntil && Date.now() >= current.blockedUntil) {
      current.attempts = 0;
      current.blockedUntil = null;
    }

    const newAttempts = current.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      blockedUntil: newAttempts >= MAX_ATTEMPTS
        ? Date.now() + BLOCK_DURATION_MS
        : null,
    };

    saveState(newState);
    setState(newState);
  }, []);

  return {
    canGenerate,
    attemptsLeft,
    remainingSeconds,
    recordAttempt,
  };
}
