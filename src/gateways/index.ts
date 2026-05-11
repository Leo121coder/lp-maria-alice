/**
 * gateways/index.ts — Barrel export do sistema multi-gateway
 */
export { createGateway, listGateways } from './PaymentFactory';
export type {
  IPaymentGateway,
  CreatePixRequest,
  CreatePixResponse,
  CheckStatusResponse,
  GatewayConfig,
  PaymentStatus,
  DonorInfo,
} from './types';
