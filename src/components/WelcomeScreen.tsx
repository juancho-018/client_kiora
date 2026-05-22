import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';

interface WelcomeScreenProps {
  onOpenManual?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenManual }) => {
  const setAppStarted = useCartStore((state) => state.setAppStarted);

  const handleLanguageChange = (lang: string) => {
    if ((window as any).Weglot) {
      (window as any).Weglot.switchTo(lang);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="/HomeStart.jpg" 
          alt="Kiora Welcome" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo - Official Vectorized White Image */}
          <div className="mb-12">
            <img 
              src="/logo-kiora-vectorizado-blanco.png" 
              alt="Kiora" 
              className="w-80 md:w-[450px] mx-auto drop-shadow-2xl"
            />
            <p className="text-xl md:text-2xl font-bold tracking-[0.3em] uppercase mt-6 opacity-90 drop-shadow-lg">
              Dulcería Los Robles
            </p>
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAppStarted(true)}
            className="group relative z-50 px-12 py-6 bg-strawberry-red text-white text-2xl font-black rounded-full shadow-[0_20px_50px_rgba(255,59,59,0.3)] transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative">TOCA PARA ORDENAR</span>
          </motion.button>

          {/* Languages - Official Programmatic Switching */}
          <div className="mt-20 relative z-50 flex items-center justify-center gap-6 text-sm font-bold opacity-80">
            <button 
              onClick={() => handleLanguageChange('es')}
              className="hover:text-strawberry-red transition-colors flex items-center gap-2 cursor-pointer p-2"
            >
              <span className="text-xl font-normal opacity-70">CO</span> Español
            </button>
            <div className="w-px h-4 bg-white/30"></div>
            <button 
              onClick={() => handleLanguageChange('en')}
              className="hover:text-strawberry-red transition-colors flex items-center gap-2 cursor-pointer p-2"
            >
              <span className="text-xl font-normal opacity-70">US</span> English
            </button>
          </div>
        </motion.div>

        {/* Manual Check Button */}
        <div className="absolute bottom-10 right-10">
          <button 
            onClick={onOpenManual}
            className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20 transition-all opacity-50 hover:opacity-100"
          >
            Consultar Pedido Manual
          </button>
        </div>
      </div>

      {/* Decorative Blur - Added pointer-events-none to avoid click blocking */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </div>
  );
};
