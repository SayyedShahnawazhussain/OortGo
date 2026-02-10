
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] overflow-hidden">
      {/* Background Particles Simulation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100],
              opacity: [0, 0.5, 0],
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <div className="relative">
        {/* Soft Cinematic Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.2, 0.1], scale: [0.8, 1.2, 1] }}
          transition={{ duration: 3 }}
          className="absolute inset-0 bg-cyan-500/20 blur-[80px] rounded-full"
        />

        {/* The OortGo Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, z: -100 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            z: 0,
          }}
          transition={{ 
            duration: 2.5, 
            ease: [0.16, 1, 0.3, 1] // Custom quintic ease-out
          }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative group">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              OortGo
            </h1>
            
            {/* Reflective Light Sweep */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
            />
          </div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            transition={{ duration: 1.5, delay: 1.5 }}
            className="h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-400 mt-2 rounded-full"
          />
        </motion.div>
      </div>

      {/* Floating fog effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black pointer-events-none" />
    </div>
  );
};

export default Splash;
