/**
 * SagacePayAdapter.ts — Integração com SagacePay (PixNerva)
 * 
 * Documentação: https://sub.sagacepay.com/docs
 * Base URL: https://pixnerva.com.br/api
 * 
 * Endpoints usados:
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
  private apiKey: string;
  private apiUrl: string;

  constructor(config: GatewayConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://pixnerva.com.br/api';
  }

  async createPix(request: CreatePixRequest): Promise<CreatePixResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
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

    const res = await fetch(`${this.apiUrl}/sales`, {
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
    const res = await fetch(`${this.apiUrl}/sales/${saleId}`, {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey },
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
