/**
 * SagacePayAdapter.ts — Integração com SagacePay (PixNerva)
 * 
 * Documentação: https://sub.sagacepay.com/docs
 * 
 * ⚠️ SEGURANÇA: Este adapter NÃO possui acesso à API Key.
 *    Todas as chamadas passam pela Edge Function gateway-proxy
 *    que injeta a x-api-key no servidor Supabase.
 * 
 * Endpoints usados (via proxy):
 *   POST /sales       → Criar cobrança PIX
 *   GET  /sales/:id   → Consultar status
 */

import type {
  IPaymentGateway,
  CreatePixRequest,
  CreatePixResponse,
  CheckStatusResponse,
  GatewayConfig,
  PaymentStatus,
} from '../types';

/**
 * Anon key pública do Supabase — necessária para autenticar
 * chamadas às Edge Functions. É PÚBLICA por design (não é um secret).
 * Ref: https://supabase.com/docs/guides/functions/auth
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0bHR3bWV2dXJ1bHNuZm5jdGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjUyOTcsImV4cCI6MjA5NDEwMTI5N30.Syv0Uq4esSoyIDK2PGR9cH5c9OCzV552atkJdWzB44w';

/** Mapeia os status do SagacePay para o nosso padrão */
function mapStatus(sagaceStatus: string): PaymentStatus {
  switch (sagaceStatus) {
    case 'paid':     return 'paid';
    case 'pending':  return 'pending';
    case 'failed':   return 'failed';
    case 'refunded': return 'refunded';
    case 'expired':  return 'expired';
    default:         return 'pending';
  }
}

export class SagacePayAdapter implements IPaymentGateway {
  readonly name = 'sagacepay';
  private proxyUrl: string;

  constructor(config: GatewayConfig) {
    this.proxyUrl = config.proxyUrl;
  }

  async createPix(request: CreatePixRequest): Promise<CreatePixResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    };

    // Idempotência (evita cobranças duplicadas por retry de rede)
    if (request.idempotencyKey) {
      headers['idempotency-key'] = request.idempotencyKey;
    }

    const body: Record<string, unknown> = {
      amount: request.amount,
      description: request.description,
      expirationInSeconds: 1800, // 30 minutos
      customer: {
        name: request.donor.name,
        document: request.donor.document,
        email: request.donor.email,
        phone: request.donor.phone,
      },
      items: [
        {
          description: request.description,
          quantity: 1,
          unitPrice: request.amount,
        },
      ],
    };

    // Tracking de marketing (UTMs, fbclid, etc.)
    if (request.tracking) {
      body.tracking = {
        utmSource: request.tracking.utmSource,
        utmCampaign: request.tracking.utmCampaign,
        fbclid: request.tracking.fbclid,
        fbp: request.tracking.fbp,
        fbc: request.tracking.fbc,
        clientUserAgent: request.tracking.clientUserAgent,
        clientIpAddress: request.tracking.clientIpAddress,
      };
    }

    const res = await fetch(`${this.proxyUrl}/sales`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return {
        success: false,
        saleId: '',
        transactionId: '',
        pixCode: '',
        pixQrCodeUrl: '',
        status: 'failed',
        error: err.message || `Erro HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    return {
      success: true,
      saleId: data.id,
      transactionId: data.transactionId,
      pixCode: data.pixCode,
      pixQrCodeUrl: data.pixQrCode,
      status: mapStatus(data.status),
    };
  }

  async checkStatus(saleId: string): Promise<CheckStatusResponse> {
    const res = await fetch(`${this.proxyUrl}/sales/${saleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`SagacePay checkStatus failed: HTTP ${res.status}`);
    }

    const data = await res.json();

    return {
      saleId: data.id,
      status: mapStatus(data.status),
      amount: data.amount,
      paidAt: data.updatedAt,
    };
  }
}
