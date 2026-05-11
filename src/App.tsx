import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DonationSidebar } from './components/DonationSidebar';
import { CampaignTabs } from './components/CampaignTabs';
import { Footer } from './components/Footer';
import { DonateModal } from './components/DonateModal';
import { PixModal } from './components/PixModal';
import './styles.css';

export default function App() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixAmount, setPixAmount] = useState(0);

  function handleDonate(amount: number) {
    if (amount > 0) {
      setPixAmount(amount);
      setShowPixModal(true);
    } else {
      setShowDonateModal(true);
    }
  }

  function handleSelectValue(amount: number) {
    setShowDonateModal(false);
    setPixAmount(amount);
    setShowPixModal(true);
  }

  return (
    <>
      {/* Banner de urgência */}
      <div className="urgency-banner">
        URGENTE: Ajude Maria Alice contra o câncer. Toda doação faz a diferença!
      </div>

      <Header />

      <main className="main-content">
        <div className="container">
          {/* Título Centralizado no Topo */}
          <div className="top-vakinha">
            <span className="top-category">SOLIDARIEDADE / SAÚDE</span>
            <h1 className="campaign-title">Todos pela Maria Alice</h1>
            <span className="campaign-subtitle-detail">
              Nossa pequena guerreira de Luziânia/GO luta contra um Rabdomiossarcoma. A família conta com a solidariedade de toda a região para custear o tratamento oncológico.
            </span>
          </div>

          {/* Grid Principal (Grid Areas) */}
          <div className="main-grid">
            <div className="content-hero">
              <Hero />
            </div>
            <div className="content-sidebar">
              <DonationSidebar onDonate={handleDonate} />
            </div>
            <div className="content-tabs">
              <CampaignTabs onDonate={() => setShowDonateModal(true)} />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <div className="mobile-cta">
        <button className="btn-donate-mobile" onClick={() => setShowDonateModal(true)}>
          Ajudar Maria Alice agora
        </button>
      </div>

      <DonateModal isOpen={showDonateModal} onClose={() => setShowDonateModal(false)} onSelectValue={handleSelectValue} />
      <PixModal isOpen={showPixModal} amount={pixAmount} onClose={() => setShowPixModal(false)} />
    </>
  );
}
