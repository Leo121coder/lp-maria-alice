import { useState, useEffect, useRef } from 'react';

export function Hero() {
  const images = [
    '/images/CARROSEL 1.webp',
    '/images/CARROSSEL 2.png',
    '/images/CARROSEL 3.png'
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-play (sincronizado com o scroll nativo)
  useEffect(() => {
    const timer = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (currentIndex + 1) % images.length;
        const width = scrollRef.current.clientWidth;
        scrollRef.current.scrollTo({
          left: nextIndex * width,
          behavior: 'smooth'
        });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, images.length]);

  // Sincronizar as bolinhas (dots) quando o usuário arrasta pelo dedo (touch)
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  return (
    <section className="hero-gallery">

      {/* Galeria / Banner (Carrossel Nativo) */}
      <div className="galeria" style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', background: '#f4f4f5' }}>
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="hide-scrollbar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', // Centraliza verticalmente se as imagens tiverem alturas diferentes
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
        >
          {images.map((src, i) => (
            <img 
              key={i}
              src={src} 
              alt={`Maria Alice ${i + 1}`} 
              fetchPriority={i === 0 ? "high" : "auto"} 
              loading={i === 0 ? "eager" : "lazy"} 
              decoding={i === 0 ? "sync" : "async"}
              style={{ 
                width: '100%', 
                flex: '0 0 100%', 
                height: 'auto', 
                maxHeight: '550px', // Evita que a imagem 2 (vertical) fique gigante
                display: 'block', 
                objectFit: 'contain', // Garante que NADA seja cortado
                scrollSnapAlign: 'start'
              }} 
            />
          ))}
        </div>
        
        {/* Indicadores do Carrossel (Dots) */}
        <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={() => scrollTo(i)}
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: i === currentIndex ? '#24CA68' : 'rgba(255, 255, 255, 0.5)', 
                border: 'none', 
                padding: 0, 
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
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
