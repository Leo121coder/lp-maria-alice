export function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <a href="#" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          {/* Ícone de coração/solidariedade (estilo Vakinha) */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24CA68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ color: '#24CA68', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: '1', textTransform: 'uppercase' }}>
              Campanha
            </span>
            <span style={{ color: '#24CA68', fontSize: '15px', fontWeight: 800, letterSpacing: '0.2px', lineHeight: '1', textTransform: 'uppercase' }}>
              Para Maria Alice
            </span>
          </div>
        </a>
      </div>
    </header>
  );
}
