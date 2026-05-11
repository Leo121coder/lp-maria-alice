/**
 * PixModal.tsx — Modal de pagamento PIX (Multi-Gateway)
 * 
 * Usa o hook usePayment que abstrai o gateway ativo.
 * Mostra: QR Code + código copia-e-cola + countdown + polling automático.
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
  const [step, setStep] = useState<'form' | 'pix'>('form');
  const inputRef = useRef<HTMLInputElement>(null);

  // Resetar quando o modal fecha — usamos ref para evitar setState no effect
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    // Só reseta quando transiciona de open → closed
    if (prevIsOpenRef.current && !isOpen) {
      reset();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset]);

  // Quando isOpen muda para true, inicializa o step
  // Feito fora do effect para evitar cascading renders
  if (!isOpen && step !== 'form') {
    setStep('form');
    setCopied(false);
  }

  // Copy-to-clipboard com fallback
  async function handleCopy() {
    const code = pixData?.pixCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback para navegadores antigos
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

  // Quando o doador submete o formulário
  async function handleDonorSubmit(donor: DonorInfo) {
    setStep('pix');
    await createPix(amount, donor);
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

        {/* Etapa 1: Formulário do doador */}
        {step === 'form' && (
          <DonorForm amount={amount} onSubmit={handleDonorSubmit} />
        )}

        {/* Etapa 2: PIX gerado */}
        {step === 'pix' && (
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
                <button className="btn-retry" onClick={() => setStep('form')}>
                  Tentar novamente
                </button>
              </div>
            )}

            {/* PIX pronto */}
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
                <button className="btn-retry" onClick={() => { reset(); setStep('form'); }}>
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
        )}
      </div>
    </div>
  );
}

/* ========================================
   Formulário do Doador (inline)
   ======================================== */

interface DonorFormProps {
  amount: number;
  onSubmit: (donor: DonorInfo) => void;
}

function DonorForm({ amount, onSubmit }: DonorFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  /** Máscara simples de CPF: 000.000.000-00 */
  function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  /** Máscara de telefone: (00) 00000-0000 */
  function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: anonymous ? 'Anônimo' : name.trim(),
      email: email.trim(),
      document: document.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
    });
  }

  const isValid = email.includes('@') && document.replace(/\D/g, '').length === 11;

  return (
    <form className="donor-form" onSubmit={handleSubmit}>
      <h2>Doar R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
      <p className="donor-form-subtitle">
        Preencha seus dados para gerar o PIX
      </p>

      <label className="donor-checkbox">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={e => setAnonymous(e.target.checked)}
        />
        <span>Doar anonimamente</span>
      </label>

      {!anonymous && (
        <div className="donor-field">
          <label htmlFor="donor-name">Nome completo</label>
          <input
            id="donor-name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
      )}

      <div className="donor-field">
        <label htmlFor="donor-email">E-mail</label>
        <input
          id="donor-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="donor-field">
        <label htmlFor="donor-cpf">CPF</label>
        <input
          id="donor-cpf"
          type="text"
          placeholder="000.000.000-00"
          value={document}
          onChange={e => setDocument(maskCpf(e.target.value))}
          inputMode="numeric"
          required
        />
      </div>

      <div className="donor-field">
        <label htmlFor="donor-phone">Telefone</label>
        <input
          id="donor-phone"
          type="text"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={e => setPhone(maskPhone(e.target.value))}
          inputMode="numeric"
        />
      </div>

      <button
        type="submit"
        className="btn-generate-pix"
        disabled={!isValid}
      >
        Gerar PIX
      </button>

      <p className="donor-form-security">
        🔒 Seus dados são protegidos e utilizados apenas para geração do PIX.
      </p>
    </form>
  );
}
