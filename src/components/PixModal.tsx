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
  
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen && status === 'idle') {
      const anonymousDonor: DonorInfo = {
        name: 'Anônimo',
        document: '00000000000',
        email: 'anonimo@doacao.com',
        phone: '00000000000',
      };
      void createPix(amount, anonymousDonor);
    }

    if (prevIsOpenRef.current && !isOpen) {
      reset();
      setCopied(false);
    }
    
    prevIsOpenRef.current = isOpen;
  }, [isOpen, status, amount, createPix, reset]);

  if (!isOpen && copied) {
    setCopied(false);
  }

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

  // Gerador de QR Code nativo usando o pixCode (Fallback Infalível)
  const qrCodeUrl = pixData?.pixQrCodeUrl 
    || (pixData?.pixCode ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&data=${encodeURIComponent(pixData.pixCode)}` : null);

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', position: 'fixed', inset: 0, zIndex: 99999 }}>
      <div 
        className="modal-content pix-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: 'linear-gradient(145deg, #ffffff, #f9f9fb)',
          borderRadius: '24px', 
          width: '90%', 
          maxWidth: '420px', 
          padding: '2.5rem', 
          position: 'relative', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0,0,0,0.05)',
          animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <button 
          onClick={handleClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f3f5', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = '#e9ecef'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f3f5'}
        >
          ✕
        </button>

        <div style={{ background: 'rgba(36, 202, 104, 0.12)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="#24CA68"/>
            <path d="M12 7L7 12L12 17L17 12L12 7Z" fill="white"/>
          </svg>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#1a1d20', letterSpacing: '-0.5px' }}>Pagamento via PIX</h2>
        <p style={{ margin: '0 0 24px', fontSize: '16px', color: '#6c757d', fontWeight: '500' }}>
          Total a doar: <strong style={{ color: '#24CA68', fontSize: '18px' }}>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </p>

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
            <div className="pix-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #24CA68', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginTop: '16px', color: '#495057', fontWeight: '600' }}>Gerando código PIX Seguro...</span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '20px', background: '#fff5f5', borderRadius: '16px', border: '1px solid #ffe3e3', width: '100%' }}>
            <p style={{ margin: '0 0 16px', color: '#e03131', fontWeight: '600', fontSize: '15px' }}>⚠️ {errorMessage || 'Houve um erro de comunicação.'}</p>
            <button 
              onClick={() => createPix(amount, { name: 'Anônimo', document: '00000000000', email: 'anonimo@doacao.com', phone: '00000000000' })}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#e03131', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {(status === 'ready' || status === 'polling') && pixData && qrCodeUrl && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease' }}>
            
            <div style={{ background: '#f8f9fa', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', border: '1px solid #e9ecef' }}>
              <span style={{ fontSize: '18px' }}>⏱</span>
              <span style={{ fontSize: '14px', color: '#495057', fontWeight: '600' }}>Expira em <strong style={{ color: '#e03131' }}>{formatTime(timeLeft)}</strong></span>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 0 0 4px rgba(36,202,104,0.1)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <img
                src={qrCodeUrl}
                alt="QR Code PIX"
                style={{ width: '200px', height: '200px', objectFit: 'contain', display: 'block' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<p style="color:#e03131; font-weight:bold; padding:40px;">Falha ao carregar QRCode. Use o Copia e Cola abaixo.</p>'; }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#495057', fontWeight: '600', textAlign: 'left' }}>Código Copia e Cola:</p>
              <div style={{ display: 'flex', background: '#f1f3f5', borderRadius: '12px', padding: '4px', border: '1px solid #dee2e6' }}>
                <input
                  ref={inputRef}
                  value={pixData.pixCode}
                  readOnly
                  onClick={() => inputRef.current?.select()}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', fontSize: '14px', color: '#495057', outline: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                />
                <button
                  onClick={handleCopy}
                  style={{ background: copied ? '#1aaa55' : '#24CA68', color: 'white', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: copied ? 'none' : '0 4px 12px rgba(36,202,104,0.3)' }}
                >
                  {copied ? '✓ Copiado' : 'COPIAR'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px', padding: '12px 20px', background: 'rgba(36, 202, 104, 0.08)', borderRadius: '100px' }}>
               <div style={{ width: '16px', height: '16px', border: '2.5px solid #24CA68', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
               <span style={{ fontSize: '14px', color: '#24CA68', fontWeight: '600' }}>Aguardando pagamento...</span>
            </div>

          </div>
        )}

        {status === 'expired' && (
          <div style={{ padding: '20px', background: '#fff5f5', borderRadius: '16px', border: '1px solid #ffe3e3', width: '100%' }}>
            <p style={{ margin: '0 0 16px', color: '#e03131', fontWeight: '600', fontSize: '15px' }}>⏰ Este PIX expirou por segurança.</p>
            <button 
              onClick={() => createPix(amount, { name: 'Anônimo', document: '00000000000', email: 'anonimo@doacao.com', phone: '00000000000' })}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1a1d20', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Gerar novo PIX
            </button>
          </div>
        )}

        {status === 'paid' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '64px', margin: '10px 0', animation: 'bounce 2s infinite' }}>💚</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: '#1aaa55', fontWeight: '800' }}>Pagamento Confirmado!</h3>
            <p style={{ margin: '0 0 20px', color: '#495057', fontSize: '15px', lineHeight: '1.5' }}>Deus te abençoe imensamente pelo seu gesto de amor com Maria Alice.</p>
            <button onClick={handleClose} style={{ width: '100%', padding: '14px', background: '#1aaa55', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Fechar Tela</button>
          </div>
        )}
        
        <style>{`
          @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-15px); } 60% { transform: translateY(-7px); } }
        `}</style>
      </div>
    </div>
  );
}
