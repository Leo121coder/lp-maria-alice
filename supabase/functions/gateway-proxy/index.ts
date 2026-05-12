/**
 * gateway-proxy — Edge Function proxy para SagacePay
 * 
 * Responsabilidades:
 * 1. Injeta x-api-key (Zero Secrets no Frontend)
 * 2. Rate Limiting por IP (5 req / 10 min — anti-abuso)
 * 3. Proxy transparente de request/response
 * 
 * Rate Limiting baseado no módulo RiseDev validado:
 * rate-limiting-service (score 100/100)
 * 
 * ⚠️ SEGURANÇA: API Key vive EXCLUSIVAMENTE em Deno.env (Supabase Secrets).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SAGACEPAY_BASE_URL = 'https://sub.sagacepay.com/api';
const API_KEY = Deno.env.get('SAGACEPAY_API_KEY') ?? '';

// ─── Rate Limiting (In-Memory) ──────────────────────────
// Baseado no padrão RiseDev: rate-limiting-service

interface RateLimitEntry {
  count: number;
  firstAt: number;
  blockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;     // 10 minutos
const RATE_LIMIT_BLOCK_MS = 30 * 60 * 1000;       // 30 minutos de bloqueio
const RATE_LIMIT_CLEANUP_MS = 60 * 60 * 1000;     // Cleanup a cada 1 hora

/**
 * Extrai IP real do client, priorizando headers de proxy (Cloudflare/Netlify).
 * Padrão RiseDev: rate-limiting-service → getClientIP()
 */
function getClientIP(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Verifica e atualiza rate limit para um identificador.
 * Retorna { allowed: boolean, retryAfter?: number }
 */
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Se está bloqueado
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Se estava bloqueado mas expirou → reseta
  if (entry?.blockedUntil && now >= entry.blockedUntil) {
    rateLimitMap.delete(identifier);
  }

  // Verificar janela
  if (entry && !entry.blockedUntil) {
    const windowExpired = (now - entry.firstAt) > RATE_LIMIT_WINDOW_MS;

    if (windowExpired) {
      // Janela expirou → reseta
      rateLimitMap.set(identifier, { count: 1, firstAt: now, blockedUntil: null });
      return { allowed: true };
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Limite excedido → bloqueia
      const blockedUntil = now + RATE_LIMIT_BLOCK_MS;
      entry.blockedUntil = blockedUntil;
      rateLimitMap.set(identifier, entry);
      const retryAfter = Math.ceil(RATE_LIMIT_BLOCK_MS / 1000);
      return { allowed: false, retryAfter };
    }

    // Dentro da janela, incrementa
    entry.count++;
    entry.lastAt = now;
    rateLimitMap.set(identifier, entry);
    return { allowed: true };
  }

  // Primeira requisição deste IP
  rateLimitMap.set(identifier, { count: 1, firstAt: now, blockedUntil: null });
  return { allowed: true };
}

/**
 * Limpa entradas expiradas do Map para evitar memory leak.
 * Roda periodicamente.
 */
function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    const isExpiredWindow = (now - entry.firstAt) > RATE_LIMIT_WINDOW_MS;
    const isExpiredBlock = entry.blockedUntil ? now > entry.blockedUntil : false;

    if (isExpiredWindow && (!entry.blockedUntil || isExpiredBlock)) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup periódico
setInterval(cleanupRateLimits, RATE_LIMIT_CLEANUP_MS);

// ─── Main Handler ────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // 1. Tratar preflight request de CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Rate Limit Check (apenas para POST — criação de PIX)
    if (req.method === 'POST') {
      const clientIP = getClientIP(req);
      const rateCheck = checkRateLimit(clientIP);

      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'rate_limited',
            message: 'Limite de requisições excedido. Tente novamente mais tarde.',
            retryAfter: rateCheck.retryAfter,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': String(rateCheck.retryAfter || 60),
            },
          }
        );
      }
    }

    // 3. Extrair path do endpoint
    const url = new URL(req.url);
    const match = url.pathname.match(/gateway-proxy(.*)/);
    const path = match ? match[1] : '';

    if (!path || path === '/') {
      return new Response(JSON.stringify({ error: 'Endpoint proxy inválido. Esperado um caminho (ex: /sales).' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const targetUrl = `${SAGACEPAY_BASE_URL}${path}`;
    
    // 4. Preparar headers para o gateway real
    const headers = new Headers();
    headers.set('x-api-key', API_KEY);
    headers.set('Content-Type', 'application/json');

    // 5. Preparar options do fetch
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const textBody = await req.text();
      if (textBody) {
        fetchOptions.body = textBody;
      }
    }

    // 6. Fazer a chamada ao Gateway real
    const apiResponse = await fetch(targetUrl, fetchOptions);
    const responseData = await apiResponse.text();

    // 7. Repassar a resposta com status code original
    return new Response(responseData, {
      status: apiResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: 'Proxy Request Failed', details: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
