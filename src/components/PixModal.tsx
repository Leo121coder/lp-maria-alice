/**
 * PixModal.tsx — Modal de pagamento PIX (Multi-Gateway)
 * 
 * Usa o hook usePayment que abstrai o gateway ativo.
 * Mostra: QR Code + código copia-e-cola + countdown + polling automático.
 * Ao abrir, aciona automaticamente a geração do PIX usando dados anônimos (doação rápida).
 */

import { useState, useRef, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import { CONFIG } from '../config';
import type { DonorInfo } from '../gateways';

interface PixModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

/** Formata segundos em MM:SS */
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PixModal({ isOpen, amount, onClose }: PixModalProps) {
  const { status, pixData, errorMessage, timeLeft, createPix, reset } = usePayment();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track previous open state
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // Quando modal abre: gera PIX automático se estiver inativo
    if (!prevIsOpenRef.current && isOpen && status === 'idle') {
      const anonymousDonor: DonorInfo = {
        name: 'Anônimo',
        document: '00000000000',
        email: 'anonimo@doacao.com',
        phone: '00000000000',
      };
      // Chama o createPix de forma asíncrona sem bloquear
      void createPix(amount, anonymousDonor);
    }

    // Quando modal fecha: reseta
    if (prevIsOpenRef.current && !isOpen) {
      reset();
      setCopied(false);
    }
    
    prevIsOpenRef.current = isOpen;
  }, [isOpen, status, amount, createPix, reset]);

  // Sincronizar estado copy se fechar bruscamente
  if (!isOpen && copied) {
    setCopied(false);
  }

  // Copy-to-clipboard com fallback
  async function handleCopy() {
    const code = pixData?.pixCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content pix-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>✕</button>

        <>
          <h2>Pagamento via PIX</h2>
          <p className="pix-amount">
            Valor: R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          {/* Loading */}
          {status === 'loading' && (
            <div className="pix-loading">
              <div className="pix-spinner" />
              <span>Gerando código PIX...</span>
            </div>
          )}

          {/* Erro */}
          {status === 'error' && (
            <div className="pix-error">
              <p>❌ {errorMessage || 'Erro ao gerar PIX.'}</p>
              <button 
                className="btn-retry" 
                onClick={() => createPix(amount, { name: 'Anônimo', document: '00000000000', email: 'anonimo@doacao.com', phone: '00000000000' })}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* PIX pronto ou em andamento */}
          {(status === 'ready' || status === 'polling') && pixData && (
            <>
              {/* Countdown */}
              <div className="pix-countdown">
                <span className="pix-countdown-icon">⏱</span>
                <span>Expira em <strong>{formatTime(timeLeft)}</strong></span>
              </div>

              {/* QR Code */}
              {pixData.pixQrCodeUrl && (
                <div className="qr-container">
                  <img
                    src={pixData.pixQrCodeUrl}
                    alt="QR Code PIX"
                    width="220"
                    height="220"
                  />
                </div>
              )}

              {/* Código copia-e-cola */}
              <div className="pix-code-section">
                <input
                  ref={inputRef}
                  value={pixData.pixCode}
                  readOnly
                  className="pix-code-input"
                  onClick={() => inputRef.current?.select()}
                />
                <button
                  className="btn-copy-pix"
                  onClick={handleCopy}
                  style={{ background: copied ? '#1aaa55' : '#24CA68' }}
                >
                  {copied ? 'Copiado! ✓' : 'Copiar código PIX'}
                </button>
              </div>

              {/* Aguardando */}
              <div className="pix-waiting">
                <div className="pix-spinner" />
                <span>Aguardando pagamento...</span>
              </div>
            </>
          )}

          {/* Expirado */}
          {status === 'expired' && (
            <div className="pix-error">
              <p>⏰ PIX expirado. Gere um novo código.</p>
              <button 
                className="btn-retry" 
                onClick={() => createPix(amount, { name: 'Anônimo', document: '00000000000', email: 'anonimo@doacao.com', phone: '00000000000' })}
              >
                Gerar novo PIX
              </button>
            </div>
          )}

          {/* Confirmado */}
          {status === 'paid' && (
            <div className="pix-confirmed">
              <div className="confirmed-icon">💚</div>
              <h3>Doação confirmada!</h3>
              <p>Obrigado por esse gesto de carinho com Maria Alice!</p>

              {CONFIG.CROSS_SELL.enabled && (
                <div className="cross-sell">
                  <p>Se quiser continuar ajudando, conheça outro caso:</p>
                  <a
                    href={CONFIG.CROSS_SELL.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cross-sell"
                  >
                    Conhecer {CONFIG.CROSS_SELL.name}
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
