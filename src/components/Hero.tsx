import { useState, useEffect } from 'react';

export function Hero() {
  const images = [
    '/images/CARROSEL 1.webp',
    '/images/CARROSSEL 2.png',
    '/images/CARROSEL 3.png'
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="hero-gallery">

      {/* Galeria / Banner (Carrossel) */}
      <div className="galeria" style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
        <div style={{ display: 'flex', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${currentIndex * 100}%)` }}>
          {images.map((src, i) => (
            <img 
              key={i}
              src={src} 
              alt={`Maria Alice ${i + 1}`} 
              fetchPriority={i === 0 ? "high" : "auto"} 
              loading={i === 0 ? "eager" : "lazy"} 
              decoding={i === 0 ? "sync" : "async"}
              style={{ width: '100%', flex: '0 0 100%', height: 'auto', display: 'block', objectFit: 'cover', aspectRatio: '4/3' }} 
            />
          ))}
        </div>
        
        {/* Indicadores do Carrossel (Dots) */}
        <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentIndex(i)}
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: i === currentIndex ? '#1C9D52' : 'rgba(255, 255, 255, 0.6)', 
                border: 'none', 
                padding: 0, 
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transition: 'background 0.3s'
              }} 
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
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
