/**
 * gateway-proxy — Edge Function para atuar como proxy das chamadas da SagacePay
 * 
 * Motivo: A API da SagacePay (e maioria dos gateways de pagamento) NÃO permite chamadas 
 * vindas diretamente do navegador (Front-end) por segurança (bloqueio de CORS).
 * Além disso, previne o vazamento da chave de API.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SAGACEPAY_BASE_URL = 'https://sub.sagacepay.com/api';
const API_KEY = Deno.env.get('SAGACEPAY_API_KEY') ?? '';

Deno.serve(async (req: Request) => {
  // 1. Tratar preflight request de CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Extrai o que vier APÓS "gateway-proxy" na URL (infalível em qualquer roteador Supabase)
    const match = url.pathname.match(/gateway-proxy(.*)/);
    const path = match ? match[1] : '';

    if (!path || path === '/') {
      return new Response(JSON.stringify({ error: 'Endpoint proxy inválido. Esperado um caminho (ex: /sales).' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const targetUrl = `${SAGACEPAY_BASE_URL}${path}`;
    
    // Preparar headers
    const headers = new Headers();
    headers.set('x-api-key', API_KEY);
    headers.set('Content-Type', 'application/json');

    // Preparar options do fetch
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

    // Fazer a chamada ao Gateway real
    const apiResponse = await fetch(targetUrl, fetchOptions);
    const responseData = await apiResponse.text(); // Usa text pra evitar falha se o JSON vier vazio

    // Repassar a resposta do gateway exatamente como veio, com status code original e liberando o CORS
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
