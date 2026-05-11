import { useState, useRef } from 'react';
import { CONFIG } from '../config';
import QRCode from 'qrcode';

interface PixModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

// Geradores de dados aleatórios
function randomName() {
  const first = ['Ana','Maria','Carlos','João','Pedro','Julia','Lucas','Fernanda','Rafael','Camila'];
  const last = ['Silva','Santos','Oliveira','Souza','Pereira','Costa','Ferreira','Rodrigues'];
  return first[Math.floor(Math.random() * first.length)] + ' ' + last[Math.floor(Math.random() * last.length)];
}

function randomCPF() {
  const r = () => Math.floor(Math.random() * 10);
  const cpf: number[] = [];
  for (let i = 0; i < 9; i++) cpf.push(r());
  let s = 0; for (let i = 0; i < 9; i++) s += cpf[i] * (10 - i);
  let d1 = 11 - (s % 11); if (d1 >= 10) d1 = 0; cpf.push(d1);
  s = 0; for (let i = 0; i < 10; i++) s += cpf[i] * (11 - i);
  let d2 = 11 - (s % 11); if (d2 >= 10) d2 = 0; cpf.push(d2);
  return cpf.join('');
}

function randomEmail(name: string) {
  const domains = ['gmail.com','hotmail.com','outlook.com'];
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.') + Math.floor(Math.random() * 999);
  return clean + '@' + domains[Math.floor(Math.random() * domains.length)];
}

function randomPhone() {
  const ddd = ['11','21','31','41','51'][Math.floor(Math.random() * 5)];
  let n = '9'; for (let i = 0; i < 8; i++) n += Math.floor(Math.random() * 10);
  return ddd + n;
}

export function PixModal({ isOpen, amount, onClose }: PixModalProps) {
  const [pixCode, setPixCode] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'confirmed' | 'error'>('loading');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  // Gera PIX ao abrir
  useState(() => {
    if (!isOpen || !amount || !CONFIG.PIX_API_URL) return;
    generatePix();
  });

  async function generatePix() {
    setStatus('loading');
    try {
      const name = randomName();
      const body = {
        amount: Math.round(amount * 100),
        description: `Doacao para Enzo Gabriel - ${Date.now()}`,
        customer: { name, document: randomCPF(), email: randomEmail(name), phone: randomPhone() },
        item: { title: `Doacao R$ ${amount.toFixed(2)} - Enzo Gabriel`, price: Math.round(amount * 100), quantity: 1 },
        paymentMethod: 'PIX',
      };

      const res = await fetch(CONFIG.PIX_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPixCode(data.pixCode);

      // QR Code
      try {
        const url = await QRCode.toDataURL(data.pixCode, { width: 240, margin: 1 });
        setQrImage(url);
      } catch {
        setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.pixCode)}`);
      }

      setStatus('ready');
      startPolling(data.transactionId);
    } catch (err) {
      console.error('[PIX]', err);
      setStatus('error');
    }
  }

  function startPolling(txId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${CONFIG.PIX_API_URL}?transactionId=${txId}`);
        const data = await res.json();
        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current!);
          setStatus('confirmed');
          // Meta Pixel Purchase
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Purchase', { value: amount, currency: 'BRL' });
          }
        }
      } catch { /* silently retry */ }
    }, CONFIG.PIX_POLL_INTERVAL_MS);
  }

  function handleCopy() {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    if (pollRef.current) clearInterval(pollRef.current);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content pix-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>✕</button>

        <h2>Pagamento via PIX</h2>
        <p className="pix-amount">
          Valor: R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>

        {status === 'loading' && <p className="pix-loading">Gerando código PIX...</p>}

        {status === 'error' && (
          <div className="pix-error">
            <p>❌ Erro ao gerar PIX.</p>
            <button className="btn-retry" onClick={generatePix}>Tentar novamente</button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="pix-code-section">
              <input ref={inputRef} value={pixCode} readOnly className="pix-code-input" />
              <button className="btn-copy-pix" onClick={handleCopy} style={{ background: copied ? '#1aaa55' : '#24CA68' }}>
                {copied ? 'Copiado! ✓' : 'Copiar código'}
              </button>
            </div>

            <button className="btn-toggle-qr" onClick={() => setShowQr(!showQr)}>
              {showQr ? 'Ocultar QR Code' : 'Expandir QR Code'}
            </button>

            {showQr && qrImage && (
              <div className="qr-container">
                <img src={qrImage} alt="QR Code PIX" width="240" height="240" />
              </div>
            )}

            <div className="pix-waiting">
              <div className="pix-spinner" />
              <span>Aguardando pagamento...</span>
            </div>
          </>
        )}

        {status === 'confirmed' && (
          <div className="pix-confirmed">
            <div className="confirmed-icon">💚</div>
            <h3>Doação confirmada!</h3>
            <p>Obrigado por esse gesto de carinho!</p>

            {CONFIG.CROSS_SELL.enabled && (
              <div className="cross-sell">
                <p>Se quiser continuar ajudando, conheça outro caso:</p>
                <a href={CONFIG.CROSS_SELL.pageUrl} target="_blank" rel="noopener noreferrer" className="btn-cross-sell">
                  Conhecer {CONFIG.CROSS_SELL.name}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
