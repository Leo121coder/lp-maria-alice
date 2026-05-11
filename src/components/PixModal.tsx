/**
 * PixModal.tsx — Modal de pagamento PIX (Multi-Gateway)
 * 
 * Usa o hook usePayment que abstrai o gateway ativo.
 * Mostra: QR Code + código copia-e-cola + countdown + polling automático.
 * Ao abrir, aciona automaticamente a geração do PIX usando dados anônimos (doação rápida).
 */

import { useState, useRef, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import type { DonorInfo } from '../gateways';
import { QRCodeSVG } from 'qrcode.react';

interface PixModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
export function PixModal({ isOpen, amount, onClose }: PixModalProps) {
  const { status, pixData, createPix, reset } = usePayment();
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

  if (!isOpen && copied) setCopied(false);

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
    <div className="modal-overlay" onClick={handleClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', position: 'fixed', inset: 0, zIndex: 99999 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: '#ffffff',
          borderRadius: '16px', 
          width: '100%', 
          maxWidth: '420px',
          margin: '0 16px',
          position: 'relative', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          animation: 'modalSlideUp 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho Verde Escuro com X */}
        <div style={{ background: '#1C9D52', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', position: 'relative' }}>
          <div style={{ width: '24px' }}>{/* Placeholder esquerdo pra centralizar o texto */}</div>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>Finalizar Contribuição</span>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Ícone Coração Verde Transpassando */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-24px', zIndex: 2 }}>
          <div style={{ width: '48px', height: '48px', background: '#e6f8ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#24CA68', fontSize: '20px' }}>💚</span>
          </div>
        </div>

        <div style={{ padding: '24px', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#102B3F', margin: '0 0 4px' }}>Muito obrigado por sua solidariedade!</h2>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: '0 0 20px', lineHeight: '1.4' }}>Sua ajuda é fundamental para a Maria Alice.</p>

          {/* Box Laranja de Valor */}
          <div style={{ background: '#fff9ed', border: '1px solid #ffe8cc', borderRadius: '8px', padding: '12px', width: '100%', marginBottom: '20px' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#f59f00', textTransform: 'uppercase', marginBottom: '2px' }}>Você está doando!</span>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: '#24CA68' }}>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          {status === 'loading' && (
             <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid #24CA68', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
               <p style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', fontWeight: '600' }}>Gerando código PIX...</p>
               <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
             </div>
          )}

          {status === 'error' && (
             <div style={{ padding: '20px', background: '#fff5f5', borderRadius: '8px', width: '100%' }}>
               <p style={{ color: '#e03131', fontSize: '14px', fontWeight: '600' }}>⚠️ Falha ao gerar o PIX.</p>
             </div>
          )}

          {(status === 'ready' || status === 'polling') && pixData && (
            <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
              
              {/* Box Branco c/ Borda: QR Code & CopiaCola */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>QR Code do Pix</p>
                
                <div style={{ padding: '10px', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', marginBottom: '16px' }}>
                  <QRCodeSVG value={pixData.pixCode} size={150} level="M" includeMargin={false} />
                </div>

                <p style={{ fontSize: '12px', fontWeight: '700', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Ou Copie a Chave Pix</p>
                
                <input
                  ref={inputRef}
                  value={pixData.pixCode}
                  readOnly
                  onClick={() => inputRef.current?.select()}
                  style={{ width: '100%', textAlign: 'center', background: '#f8f9fa', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#495057', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '12px', cursor: 'text' }}
                />
                
                <button
                  onClick={handleCopy}
                  style={{ width: '100%', background: copied ? '#1C9D52' : '#24CA68', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  {copied ? 'CHAVE COPIADA ✓' : 'COPIAR CHAVE PIX'}
                </button>
              </div>

              {/* Instruções Passo a Passo */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f8f9fa', color: '#adb5bd', fontSize: '11px', fontWeight: '700', flexShrink: 0, border: '1px solid #e9ecef' }}>1</span>
                  <p style={{ fontSize: '13px', color: '#495057', margin: 0, lineHeight: '1.4' }}>Clique no botão verde acima para <strong>copiar a chave</strong>, ou escaneie o QR Code.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f8f9fa', color: '#adb5bd', fontSize: '11px', fontWeight: '700', flexShrink: 0, border: '1px solid #e9ecef' }}>2</span>
                  <p style={{ fontSize: '13px', color: '#495057', margin: 0, lineHeight: '1.4' }}>Abra o aplicativo do seu banco e escolha <strong>Pix Copia e Cola</strong>.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f8f9fa', color: '#adb5bd', fontSize: '11px', fontWeight: '700', flexShrink: 0, border: '1px solid #e9ecef' }}>3</span>
                  <p style={{ fontSize: '13px', color: '#495057', margin: 0, lineHeight: '1.4' }}>Cole a chave pix copiada e confirme o pagamento!</p>
                </div>
              </div>
              
            </div>
          )}

          {status === 'paid' && (
            <div style={{ padding: '40px 0', animation: 'fadeIn 0.4s ease' }}>
              <span style={{ fontSize: '50px' }}>🙌</span>
              <h3 style={{ color: '#1C9D52', margin: '16px 0 8px', fontSize: '20px' }}>Pagamento Recebido!</h3>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>Deus abençoe sua vida.</p>
            </div>
          )}
        </div>
        <style>{`
          @keyframes modalSlideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}
