import { DONATION_VALUES } from '../data';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectValue: (amount: number) => void;
}

export function DonateModal({ isOpen, onClose, onSelectValue }: DonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content donate-modal-vakinha" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-drag-handle" />

        <h2 className="modal-vakinha-title">
          Ajude Maria Alice a vencer a luta contra o câncer
        </h2>
        
        <p className="modal-vakinha-subtitle">
          Maria Alice, 4 anos, foi diagnosticada com Rabdomiossarcoma. A família precisa de ajuda urgente para custear as viagens, alimentação especial e o tratamento oncológico.
        </p>

        <div className="donate-vakinha-grid">
          {DONATION_VALUES.map(val => (
            <button key={val} className="btn-vakinha-value" onClick={() => onSelectValue(val)}>
              R$ {val},00
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
