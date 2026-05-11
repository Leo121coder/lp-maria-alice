/**
 * gateway-webhook — Edge Function para receber webhooks do SagacePay
 *
 * Recebe callbacks de pagamento (sale.paid, sale.expired, etc.)
 * e valida a assinatura HMAC-SHA256 conforme documentação oficial.
 *
 * Headers esperados do SagacePay:
 *   x-pixnerva-timestamp: Unix timestamp em segundos
 *   x-pixnerva-signature: HMAC-SHA256 de "timestamp.body"
 *
 * Eventos tratados:
 *   sale.paid     → Pagamento confirmado
 *   sale.expired  → Cobrança expirada
 *   sale.refunded → Pagamento estornado
 *   sale.failed   → Pagamento falhou
 */

const WEBHOOK_SECRET = Deno.env.get('SAGACEPAY_WEBHOOK_SECRET') ?? '';

/** Proteção contra replay attack: máximo 5 minutos */
const MAX_TIMESTAMP_AGE_SECS = 300;

/**
 * Verifica a assinatura HMAC-SHA256 do webhook
 * Conforme: https://sub.sagacepay.com/docs (seção 7)
 */
async function verifySignature(
  timestamp: string,
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!timestamp || !signature || !secret) return false;

  // Proteção contra replay attack (5 min)
  const age = Date.now() / 1000 - Number(timestamp);
  if (age > MAX_TIMESTAMP_AGE_SECS || age < 0) return false;

  // Gerar HMAC-SHA256: timestamp.body
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = encoder.encode(`${timestamp}.${rawBody}`);
  const mac = await crypto.subtle.sign('HMAC', key, data);

  // Converter para hex
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Comparação constant-time (evita timing attack)
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req: Request) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ler body raw (necessário para validação HMAC)
  const rawBody = await req.text();

  // Extrair headers de assinatura
  const timestamp = req.headers.get('x-pixnerva-timestamp') ?? '';
  const signature = req.headers.get('x-pixnerva-signature') ?? '';

  // Verificar assinatura
  const isValid = await verifySignature(timestamp, rawBody, signature, WEBHOOK_SECRET);
  if (!isValid) {
    console.error('[gateway-webhook] Assinatura inválida ou timestamp expirado');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse do body
  let payload: { event: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event, data } = payload;

  // Processar evento
  switch (event) {
    case 'sale.paid':
      console.log(`[gateway-webhook] ✅ Pagamento confirmado: ${data.id} — R$ ${data.amount}`);
      // Aqui pode-se: salvar no banco, disparar notificação, etc.
      break;

    case 'sale.expired':
      console.log(`[gateway-webhook] ⏰ Cobrança expirada: ${data.id}`);
      break;

    case 'sale.refunded':
      console.log(`[gateway-webhook] ↩️ Estorno: ${data.id}`);
      break;

    case 'sale.failed':
      console.log(`[gateway-webhook] ❌ Falha: ${data.id}`);
      break;

    default:
      console.log(`[gateway-webhook] Evento desconhecido: ${event}`);
  }

  // SagacePay espera 2xx para considerar entregue
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
