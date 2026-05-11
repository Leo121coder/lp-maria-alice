

export function Hero() {
  return (
    <section className="hero-gallery">


      {/* Galeria / Banner */}
      <div className="galeria">
        <img 
          src="/images/foto banner.png" 
          alt="Maria Alice" 
          fetchPriority="high" 
          loading="eager" 
          decoding="sync"
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
      </div>

      {/* Categorias abaixo da imagem */}
      <div className="image-meta">
        <span>Saúde / Tratamentos</span>
        <span className="location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8a8a8a">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 4.75 5.4 11.74 6.03 12.55a1.25 1.25 0 0 0 1.94 0C13.6 20.74 19 13.75 19 9c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>
          </svg>
          Luziânia / GO
        </span>
      </div>
    </section>
  );
}
