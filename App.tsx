
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Splash from './components/Splash';
import PassengerApp from './components/PassengerApp';
import DriverApp from './components/DriverApp';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SPLASH);

  // Transition from splash to app
  useEffect(() => {
    const timer = setTimeout(() => {
      // Default to Passenger for demo, can be switched
      setView(AppView.PASSENGER);
    }, 4500); // Cinematic duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black text-white selection:bg-cyan-500/30">
      {view === AppView.SPLASH && <Splash />}
      
      {view !== AppView.SPLASH && (
        <div className="flex flex-col h-full animate-in fade-in duration-700">
          {/* Internal View Switcher for the demo */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
            <button
              onClick={() => setView(AppView.PASSENGER)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === AppView.PASSENGER ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              Passenger
            </button>
            <button
              onClick={() => setView(AppView.DRIVER)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === AppView.DRIVER ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              Driver
            </button>
          </div>

          {view === AppView.PASSENGER && <PassengerApp />}
          {view === AppView.DRIVER && <DriverApp />}
        </div>
      )}
    </div>
  );
};

export default App;
