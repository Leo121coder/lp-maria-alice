import { useState, useEffect } from 'react';
import { CONFIG, img } from '../config';

export function DonationSidebar({ onDonate }: { onDonate: (amount: number) => void }) {
  const [raised, setRaised] = useState(CONFIG.CAMPAIGN.raised);
  const goal = CONFIG.CAMPAIGN.goal;
  const pct = Math.min((raised / goal) * 100, 100);

  useEffect(() => {
    let idx = 0;
    let timer: number;
    const amounts = [30, 75, 100, 60, 150, 80, 50, 120, 90, 75];
    function tick() {
      setRaised(prev => prev + amounts[idx % amounts.length]);
      idx++;
      timer = window.setTimeout(tick, CONFIG.FAKE_DONATION_INTERVAL_MS);
    }
    timer = window.setTimeout(tick, CONFIG.FAKE_DONATION_INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <aside className="donation-sidebar">
      {/* Organizador (No topo no mobile, embaixo no desktop via CSS) */}
      <div className="organizer-section">
        <img src={img('perfil.png')} alt={CONFIG.CAMPAIGN.organizer} className="organizer-avatar" />
        <div className="organizer-info">
          <strong>{CONFIG.CAMPAIGN.organizer}</strong>
          <span>Ativo(a) desde {CONFIG.CAMPAIGN.organizerSince}</span>
        </div>
      </div>

      {/* Barra verde */}
      <div className="sidebar-progresso">
        <span className="sidebar-pct-mobile">{pct.toFixed(1).replace('.', ',')}%</span>
        <div className="sidebar-bar">
          <div className="sidebar-bar-inner" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="sidebar-amounts">
        {/* Layout Desktop */}
        <div className="desktop-labels">
          <span className="sidebar-label">Arrecadado</span>
          <h2 className="sidebar-amount">
            {raised.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <div className="sidebar-meta">
            <span className="sidebar-meta-label">Meta</span>
            <span className="sidebar-meta-value">
              R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="sidebar-meta">
            <span className="sidebar-meta-label">Apoiadores</span>
            <span className="sidebar-meta-value">{CONFIG.CAMPAIGN.supporters}</span>
          </div>
        </div>

        {/* Layout Mobile (Em linha) */}
        <div className="mobile-labels">
          <span className="mobile-amount-raised">
            {raised.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="mobile-amount-goal">
            {' '}de R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Botão Desktop */}
      <div className="sidebar-acao">
        <button className="btn-donate-main" onClick={() => onDonate(0)}>
          Ajudar Maria Alice agora
        </button>
      </div>
    </aside>
  );
}
