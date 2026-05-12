import { useState, useEffect } from 'react';
import { DONOR_LIST, BUDGET_ITEMS } from '../data';
import { img } from '../config';

type Tab = 'sobre' | 'novidades' | 'quem-ajudou';

const BIBLE_QUOTES = [
  { text: 'Cada um contribua segundo propôs no coração, não com tristeza ou por necessidade; porque Deus ama ao que dá com alegria.', ref: '2 Coríntios 9:7' },
  { text: 'Quem se compadece do pobre ao Senhor empresta, e este lhe paga o seu benefício.', ref: 'Provérbios 19:17' },
  { text: 'Mais bem-aventurada coisa é dar do que receber.', ref: 'Atos 20:35' },
  { text: 'Reparte com sete, e ainda até com oito; porque não sabes que mal haverá sobre a terra.', ref: 'Eclesiastes 11:2' },
];

const COMMENTS = [
  { name: 'Maria T.', avatar: 'depoiment1%20%281%29.jpg', text: '"Doei porque não consegui ignorar essa história. Maria Alice merece dignidade e acesso aos cuidados essenciais para vencer esse câncer."', time: 'há 3 minutos' },
  { name: 'Sandra L.', avatar: 'depoiment1%20%282%29.jpg', text: '"Não consegui doar muito, mas compartilhei. Vamos ajudar a Maria Alice a ter os exames e os tratamentos que ela precisa."', time: 'há 7 minutos' },
  { name: 'Roberto C.', avatar: 'depoiment1%20%283%29.jpg', text: '"Compartilhei para alcançar mais pessoas. Vamos ajudar a Maria Alice a ter acesso aos tratamentos essenciais para sua cura!"', time: 'há 12 minutos' },
];

export function CampaignTabs({ onDonate }: { onDonate: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('sobre');
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx(i => (i + 1) % BIBLE_QUOTES.length), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="campaign-tabs">
      <nav className="tabs-nav">
        <button className={activeTab === 'sobre' ? 'active' : ''} onClick={() => setActiveTab('sobre')}>Sobre</button>
        <button className={activeTab === 'novidades' ? 'active' : ''} onClick={() => setActiveTab('novidades')}>Novidades</button>
        <button className={activeTab === 'quem-ajudou' ? 'active' : ''} onClick={() => setActiveTab('quem-ajudou')}>Quem ajudou</button>
      </nav>

      {/* ═══ TAB: SOBRE ═══ */}
      {activeTab === 'sobre' && (
        <div className="tab-content">
          <span className="created-date"><strong>Vaquinha criada em:</strong> 15/03/2026</span>

          {/* A HISTÓRIA */}
          <h2 className="section-title section-title--red">A HISTÓRIA</h2>


          <p>A história da nossa pequena Maria Alice virou nossa vida de cabeça para baixo. Moramos em Luziânia / GO, e é daqui que estamos travando a maior batalha das nossas vidas.</p>
          <p>Aos 4 anos de idade, e há exatos 4 meses, recebemos o diagnóstico de que ela tem <strong>câncer (Rabdomiossarcoma)</strong> no braço e antebraço esquerdo. Uma notícia que nenhuma família de Luziânia, ou de lugar nenhum, espera receber.</p>
          <p>Estamos fazendo essa campanha porque os custos do tratamento oncológico pesaram muito. Precisamos de ajuda para: <strong>transporte daqui de Luziânia até os hospitais oncológicos para as sessões de quimioterapia, alimentação rigorosa e exames de alto custo</strong> que não podem esperar.</p>
          <p>Nós temos muita fé de que logo essa tempestade vai passar e que a cura da Maria Alice será um lindo testemunho de vida para todos nós, mas sozinhos não conseguimos. Precisamos da nossa cidade e da sua ajuda!</p>

          {/* O QUE A MARIA ALICE MAIS PRECISA AGORA */}
          <h3 className="section-title section-title--green">O QUE A MARIA ALICE MAIS PRECISA AGORA</h3>
          <div className="highlight-box highlight-box--green">
            Neste momento, a maior necessidade é garantir o acesso rápido a <strong>exames particulares, transporte seguro de Luziânia para as clínicas e alimentação especial</strong> para as sessões de quimioterapia.
          </div>
          <p>Sem esse suporte básico, o tratamento oncológico não pode ser realizado com a frequência e segurança necessárias.</p>

          {/* URGÊNCIA REAL */}
          <h3 className="section-title section-title--red">URGÊNCIA REAL</h3>
          <div className="highlight-box highlight-box--yellow">
            O câncer infantil avança rápido. Sem os recursos para viagens e alimentação durante o tratamento, as sessões de quimioterapia podem sofrer atrasos que comprometem drasticamente as chances de cura.
          </div>
          <div className="highlight-box highlight-box--yellow">
            Sua doação acelera esse acesso e ajuda a garantir dignidade para a Maria Alice enquanto a família luta contra o tempo.
          </div>

          {/* PARA ONDE VAI O DINHEIRO */}
          <p className="section-label">Prestação de contas</p>
          <h2 className="section-title section-title--green">🎯 PARA ONDE VAI O DINHEIRO</h2>
          <div className="budget-list">
            {BUDGET_ITEMS.map((item, i) => (
              <div key={i} className="budget-item">
                <div className="budget-item-info">
                  <div className="budget-item-title">{item.title}</div>
                  {item.subtitle && <div className="budget-item-sub">{item.subtitle}</div>}
                </div>
                <div className="budget-item-value">{item.value}</div>
              </div>
            ))}
          </div>
          <p className="budget-total"><strong>Meta total estimada: R$ 60.000</strong></p>
          <p className="budget-desc">Cada real será usado para garantir os cuidados essenciais que a Maria Alice precisa para vencer o câncer com dignidade.</p>

          {/* CTA */}
          <button className="btn-cta-final" onClick={onDonate}>
            <b>DOE AGORA — AJUDE MARIA ALICE A TER OS CUIDADOS QUE PRECISA</b>
          </button>

          {/* Frase bíblica */}
          <div className="bible-quote">
            <p><em>"{BIBLE_QUOTES[quoteIdx].text}"</em> — {BIBLE_QUOTES[quoteIdx].ref}</p>
          </div>

        </div>
      )}

      {/* ═══ TAB: NOVIDADES ═══ */}
      {activeTab === 'novidades' && (
        <div className="tab-content">
          <h3 style={{ marginBottom: '20px', color: '#24CA68', fontSize: '1.25rem', fontWeight: 600 }}>✨ Seguimos firmes</h3>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#333', lineHeight: '1.6' }}>Cada doação aproxima Maria Alice da cura e ajuda a manter os cuidados contínuos que ela precisa durante o tratamento oncológico. Sua contribuição faz diferença real.</p>
            <p style={{ marginTop: '15px', color: '#333' }}><strong>Gratidão eterna.</strong></p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', margin: '30px 0' }} />

          {/* Comentários */}
          <h3 className="comments-title">Comentários recentes</h3>
          <div className="comments-list">
            {COMMENTS.map((c, i) => (
              <div key={i} className="comment-card">
                <img src={img(c.avatar)} alt={c.name} className="comment-avatar" loading="lazy" decoding="async" />
                <div className="comment-body">
                  <strong>{c.name}</strong>
                  <p>{c.text}</p>
                  <span className="comment-time">{c.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: QUEM AJUDOU ═══ */}
      {activeTab === 'quem-ajudou' && (
        <div className="tab-content">
          <h3 className="quem-ajudou-title">Anjos que ajudam Maria Alice</h3>
          <p className="quem-ajudou-sub">Essa lista representa pessoas que entenderam que ajudar o próximo é o maior ato de fé.</p>
          <div className="donor-list">
            {DONOR_LIST.map((donor, i) => (
              <div key={i} className="donation-card">
                <div className="donation-card-info">
                  <span className="donation-card-name">{donor.name}</span>
                  <span className="donation-card-time">{donor.time}</span>
                </div>
                <span className="donation-card-amount">{donor.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
