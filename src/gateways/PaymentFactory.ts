/**
 * PaymentFactory.ts — Factory Pattern para Multi-Gateway
 * 
 * Responsável por instanciar o gateway de pagamento correto
 * baseado na configuração. Para adicionar um novo gateway:
 * 
 *   1. Crie o adapter em adapters/NomeAdapter.ts
 *   2. Adicione o case no switch abaixo
 *   3. Pronto — zero mudanças no checkout/frontend
 */

import type { IPaymentGateway, GatewayConfig } from './types';
import { SagacePayAdapter } from './adapters/SagacePayAdapter';

/** Registry de gateways disponíveis */
const GATEWAY_REGISTRY: Record<string, new (config: GatewayConfig) => IPaymentGateway> = {
  sagacepay: SagacePayAdapter,
  // Futuros gateways:
  // asaas: AsaasAdapter,
  // pushinpay: PushinPayAdapter,
  // mercadopago: MercadoPagoAdapter,
};

/**
 * Cria uma instância do gateway de pagamento
 * @param gatewayName - Nome do gateway (ex: 'sagacepay')
 * @param config - Configuração com apiKey e apiUrl
 * @returns Instância do gateway pronta para uso
 */
export function createGateway(gatewayName: string, config: GatewayConfig): IPaymentGateway {
  const GatewayClass = GATEWAY_REGISTRY[gatewayName];

  if (!GatewayClass) {
    const available = Object.keys(GATEWAY_REGISTRY).join(', ');
    throw new Error(
      `Gateway "${gatewayName}" não registrado. Disponíveis: ${available}`
    );
  }

  return new GatewayClass(config);
}

/** Retorna lista de gateways registrados */
export function listGateways(): string[] {
  return Object.keys(GATEWAY_REGISTRY);
}
