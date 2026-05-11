/**
 * types.ts — Contratos do sistema Multi-Gateway
 * 
 * Toda integração de pagamento implementa IPaymentGateway.
 * Para adicionar um novo gateway, basta criar uma classe que implemente
 * essa interface e registrar no PaymentFactory.
 * 
 * ⚠️ SEGURANÇA: Nenhuma apiKey transita pelo frontend.
 *    A autenticação com o gateway real é feita EXCLUSIVAMENTE
 *    pela Edge Function gateway-proxy no Supabase.
 */

/** Status possíveis de um pagamento */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';

/** Dados do doador enviados ao gateway */
export interface DonorInfo {
  name: string;
  document: string;   // CPF
  email: string;
  phone: string;
}

/** Request para criar um PIX */
export interface CreatePixRequest {
  amount: number;            // Valor em REAIS (ex: 50.00)
  description: string;
  donor: DonorInfo;
  idempotencyKey?: string;   // Evita cobrança duplicada
  tracking?: {
    utmSource?: string;
    utmCampaign?: string;
    fbclid?: string;
    fbp?: string;
    fbc?: string;
    clientUserAgent?: string;
    clientIpAddress?: string;
  };
}

/** Resposta padronizada ao criar PIX */
export interface CreatePixResponse {
  success: boolean;
  saleId: string;            // ID da venda no gateway
  transactionId: string;     // ID da transação
  pixCode: string;           // Código copia-e-cola
  pixQrCodeUrl: string;      // URL da imagem do QR Code
  status: PaymentStatus;
  error?: string;
}

/** Resposta padronizada ao consultar status */
export interface CheckStatusResponse {
  saleId: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
}

/** Contrato que todo gateway DEVE implementar */
export interface IPaymentGateway {
  /** Nome do provedor (ex: 'sagacepay', 'asaas') */
  readonly name: string;

  /** Cria uma cobrança PIX */
  createPix(request: CreatePixRequest): Promise<CreatePixResponse>;

  /** Consulta status de uma cobrança */
  checkStatus(saleId: string): Promise<CheckStatusResponse>;
}

/** Configuração de um gateway (frontend-safe — sem secrets) */
export interface GatewayConfig {
  name: string;
  proxyUrl: string;          // URL da Edge Function proxy (nunca a URL do gateway real)
}
