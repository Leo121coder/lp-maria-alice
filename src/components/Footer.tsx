import { img } from '../config';

export function Footer() {
  return (
    <footer className="footer">
      {/* Aviso legal */}
      <div className="footer-aviso">
        <div className="container">
          <span>AVISO LEGAL: O texto e as imagens incluídos nessa página são de única e exclusiva responsabilidade do criador da vaquinha e não representam a opinião ou endosso da plataforma.</span>
        </div>
      </div>

      {/* Conteúdo principal do footer */}
      <div className="container footer-body">
        {/* Top: social icons */}
        <div className="footer-top">
          <div className="footer-socials">
            {/* Instagram */}
            <a href="#">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
            </a>
            <div className="footer-sep" />
            {/* Facebook */}
            <a href="#">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z"/></svg>
            </a>
            <div className="footer-sep" />
            {/* YouTube */}
            <a href="#">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28C8.16 5.09 9.35 5.06 10.45 5.06L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="footer-columns">
          <div className="footer-col">
            <h4>Links rápidos</h4>
            <ul>
              <li><a href="#">Quem somos</a></li>
              <li><a href="#">Vaquinhas</a></li>
              <li><a href="#">Criar vaquinhas</a></li>
              <li><a href="#">Login</a></li>
              <li><a href="#">Vaquinhas mais amadas</a></li>
              <li><a href="#">Política de privacidade</a></li>
              <li><a href="#">Termos de uso</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <ul>
              <li><a href="#">Dúvidas frequentes</a></li>
              <li><a href="#">Taxas e prazos</a></li>
              <li><a href="#">Loja de corações</a></li>
              <li><a href="#">Vakinha Premiada</a></li>
              <li><a href="#">Blog do Vakinha</a></li>
              <li><a href="#">Segurança e transparência</a></li>
              <li><a href="#">Busca por recibo</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Fale conosco</h4>
            <ul>
              <li><a href="#">Clique aqui para falar conosco</a></li>
            </ul>
            <p className="footer-schedule">De Segunda à Sexta</p>
            <div className="footer-security">
              <img src={img('selo_seguranca.webp')} alt="Selo de Segurança" className="footer-seal" loading="lazy" decoding="async" />
            </div>
          </div>
          <div className="footer-apps">
            <h4>Baixe nosso App</h4>
            <a href="#"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/pt_badge_web_generic.png" alt="Google Play" className="footer-store-badge" style={{ maxWidth: '140px', marginTop: '-10px' }} loading="lazy" decoding="async" /></a>
            <a href="#"><img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/pt-br?size=250x83&amp;releaseDate=1276560000&amp;h=7e7b68bf1aa5eb96cb2aca08115651ce" alt="Apple Store" className="footer-store-badge" style={{ maxWidth: '125px', marginTop: '5px', marginLeft: '8px' }} loading="lazy" decoding="async" /></a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-copyright">
        <span>© 2025 - Todos direitos reservados</span>
      </div>
    </footer>
  );
}
