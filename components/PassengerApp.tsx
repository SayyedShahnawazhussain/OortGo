
import { 
  Search, Mic, Bike, Zap, Car, Users, ChevronRight, X, 
  Sparkles, Calendar, Clock, CheckCircle2, MapPin, 
  Navigation, User, Info, Loader2, ArrowRight, ChevronLeft,
  Smartphone, Globe, Map, TrendingDown, AlertCircle,
  Phone, CreditCard, Star, Trash2, XCircle, Crosshair, Edit2, 
  QrCode, Landmark, CalendarCheck, Timer, ShieldCheck as Shield,
  Repeat, Navigation2, MapPinned, Bell, ArrowUpRight, Copy, Check, CarFront, ArrowUpDown
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from './MapComponent';
import { VehicleType, RideCategory, ScheduledRide, DriverDetails, BookingMode } from '../types';
import { calculateOortFare, FareResult, getSeatMap, checkVehicleAvailability } from '../services/aiMatching';
import { speakHindi, VOICES } from '../services/voiceService';

type AppStep = 'HOME' | 'DESTINATION' | 'SELECT_VEHICLE' | 'SEAT_SELECT' | 'SCHEDULE' | 'LIVE_TRIP';

const PassengerApp: React.FC = () => {
  const [step, setStep] = useState<AppStep>('HOME');
  const [pickup, setPickup] = useState('Sector 21, Rohini');
  const [destination, setDestination] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>(VehicleType.CAR_SEDAN);
  const [bookingMode, setBookingMode] = useState<BookingMode>(BookingMode.NORMAL);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['s1']);
  const [isBooking, setIsBooking] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Schedule States
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('Today');
  const [scheduleTime, setScheduleTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [driver, setDriver] = useState<DriverDetails | null>(null);

  const mockDist = 4.8; 
  const fareInfo: FareResult = useMemo(() => 
    calculateOortFare(mockDist, vehicle, selectedSeats.length, bookingMode), 
  [vehicle, selectedSeats, bookingMode, mockDist]);

  // Sync seats when vehicle changes - Ensure at least one available seat is selected
  useEffect(() => {
    const seats = getSeatMap(vehicle);
    const available = seats.filter(s => s.isAvailable);
    if (available.length > 0) {
      // If previous selection isn't valid for new vehicle, reset to first available
      setSelectedSeats([available[0].id]);
    } else {
      setSelectedSeats([]);
    }
  }, [vehicle]);

  const fetchDriverFromStorage = () => {
    const savedBank = localStorage.getItem('oortgo_bank_details');
    const savedPhoto = localStorage.getItem('oortgo_driver_photo');
    const savedQr = localStorage.getItem('oortgo_upi_qr');
    
    const bankDetails = savedBank ? JSON.parse(savedBank) : {
      accountName: 'Rahul Kumar',
      bankName: 'HDFC Bank',
      accountNumber: '5010042XXXX4492',
      ifsc: 'HDFC0001234',
      upiId: 'rahulk@upi'
    };

    return {
      name: bankDetails.accountName,
      photo: savedPhoto || 'https://i.pravatar.cc/150?u=rahul',
      phone: '+91 9988776655',
      vehicleNumber: 'DL 01 CP 4492',
      rating: 4.8,
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      ifsc: bankDetails.ifsc,
      upiId: bankDetails.upiId,
      upiQr: savedQr || undefined
    };
  };

  const handleDestinationSubmit = () => {
    if (!destination.trim()) return;
    setDestCoords({ lat: 28.5273, lng: 77.1512 }); 
    setStep('SELECT_VEHICLE');
  };

  const handleConfirmRide = () => {
    if (isScheduled) {
      speakHindi(`Aapka ride ${scheduleDate} ko ${scheduleTime} baje ke liye schedule ho gaya hai.`);
      resetApp();
      return;
    }
    
    setIsBooking(true);
    setTimeout(() => {
      setDriver(fetchDriverFromStorage());
      setIsBooking(false);
      setStep('LIVE_TRIP');
      setEta(Math.floor(Math.random() * 5) + 2);
      speakHindi(`Booking confirm ho gayi. Driver aa raha hai.`);
    }, 2000);
  };

  const handlePayNow = async () => {
    setPaymentProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setPaymentProcessing(false);
    setPaymentSuccess(true);
    speakHindi("Payment safal raha. Dhanyawad!");
    setTimeout(() => {
      setPaymentSuccess(false);
      setShowPaymentModal(false);
    }, 2000);
  };

  const resetApp = () => {
    setStep('HOME');
    setDriver(null);
    setDestination('');
    setDestCoords(null);
    setBookingMode(BookingMode.NORMAL);
    setSelectedSeats(['s1']);
    setIsScheduled(false);
  };

  const handleSwap = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const vehicleOptions = [
    { type: VehicleType.BIKE, label: 'Bike', icon: Bike, time: '2 min' },
    { type: VehicleType.AUTO, label: 'Auto', icon: Zap, time: '3 min' },
    { type: VehicleType.CAR_SEDAN, label: 'Sedan', icon: Car, time: '5 min' },
    { type: VehicleType.XL_7SEATER, label: 'Eco XL', icon: CarFront, time: '7 min' }
  ];

  return (
    <div className="flex-1 relative bg-[#050505] overflow-hidden font-['Inter']">
      <div className="absolute inset-0 z-0 h-full">
        <MapComponent 
          showDrivers={step === 'HOME'}
          targetLocation={destCoords ? { ...destCoords, label: destination } : null}
          pickupLocation={step !== 'HOME' ? { lat: 28.6139, lng: 77.2090, label: pickup } : null}
          eta={step === 'LIVE_TRIP' ? eta : null}
        />
      </div>

      {/* Direct Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && driver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-[#111] w-full max-w-md rounded-[52px] border border-white/10 p-10 shadow-4xl relative overflow-hidden">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 p-4 bg-white/5 rounded-3xl"><X size={20}/></button>
              
              <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-cyan-500/30 mb-4 shadow-2xl">
                  <img src={driver.photo} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Pay {driver.name}</h3>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1">Direct Settlement</p>
              </div>

              <div className="space-y-6 mb-10 overflow-y-auto max-h-[40vh] custom-scrollbar pr-2">
                 <div className="bg-white/5 p-8 rounded-[44px] border border-white/5 space-y-4">
                    <div className="flex items-center space-x-3 mb-2"><Landmark size={18} className="text-cyan-500"/><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bank Details</span></div>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600 uppercase">Bank</span><span className="text-sm font-black">{driver.bankName}</span></div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-zinc-600 uppercase">A/C Number</span>
                         <div className="flex items-center space-x-2"><span className="text-sm font-black tabular-nums">{driver.accountNumber}</span><Copy size={12} className="text-zinc-700 cursor-pointer"/></div>
                       </div>
                       <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600 uppercase">IFSC</span><span className="text-sm font-black tracking-widest">{driver.ifsc}</span></div>
                    </div>
                 </div>

                 {driver.upiQr && (
                   <div className="bg-white/5 p-8 rounded-[44px] border border-white/5 flex flex-col items-center">
                      <div className="flex items-center space-x-3 w-full mb-6"><QrCode size={18} className="text-cyan-500"/><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">UPI QR Code</span></div>
                      <div className="bg-white p-4 rounded-[32px] w-56 h-56 shadow-2xl"><img src={driver.upiQr} className="w-full h-full object-contain" /></div>
                      <p className="mt-6 text-xs font-black text-white/40 tracking-widest">{driver.upiId}</p>
                   </div>
                 )}
              </div>

              <div className="bg-white/5 p-6 rounded-[36px] border border-white/10 flex items-center justify-between mb-10">
                 <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Total Fare</p>
                 <p className="text-4xl font-black text-white tracking-tighter">₹{fareInfo.total}</p>
              </div>

              <button onClick={handlePayNow} disabled={paymentProcessing} className={`w-full py-8 rounded-[38px] font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center space-x-3 shadow-2xl transition-all active:scale-95 ${paymentSuccess ? 'bg-emerald-500' : 'bg-white text-black'}`}>
                {paymentProcessing ? <Loader2 className="animate-spin" /> : paymentSuccess ? <Check /> : <><CreditCard size={18} /><span>Pay Now</span></>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Components */}
      <AnimatePresence mode="wait">
        {step === 'HOME' && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-10 inset-x-6 z-50 space-y-6">
            <div onClick={() => setStep('DESTINATION')} className="bg-black/90 backdrop-blur-3xl p-7 rounded-[40px] shadow-4xl flex items-center space-x-4 border border-white/10 ring-1 ring-white/5 transition-all active:scale-[0.98]">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner"><Search className="w-6 h-6 text-white/40" /></div>
              <span className="text-white/40 font-black text-xl flex-1 tracking-tight">Where to go?</span>
              <Mic className="text-cyan-500" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {vehicleOptions.map(v => (
                <button key={v.type} onClick={() => { setVehicle(v.type); setStep('DESTINATION'); }} className="bg-black/80 backdrop-blur-2xl p-5 rounded-[32px] border border-white/5 flex flex-col items-center space-y-3 active:scale-90 transition-all">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><v.icon size={22} className="text-white/40"/></div>
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{v.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'DESTINATION' && (
          <motion.div key="dest" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-black z-[100] p-8 pt-24 flex flex-col">
            <div className="flex items-center space-x-5 mb-12">
              <button onClick={() => setStep('HOME')} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><ChevronLeft/></button>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Plan Your Ride</h2>
            </div>
            
            <div className="space-y-4 relative">
              <div className="bg-white/5 p-7 rounded-[36px] border border-white/10 flex items-center space-x-4 ring-1 ring-white/5 group transition-all focus-within:ring-cyan-500/50">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><MapPin className="text-emerald-500" size={20}/></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Pickup Location</p>
                  <input value={pickup} onChange={e => setPickup(e.target.value)} className="bg-transparent font-black text-white text-lg outline-none w-full" placeholder="Pick up from..." />
                </div>
                <Edit2 className="text-white/20 group-focus-within:text-cyan-500" size={14} />
              </div>

              <div className="absolute left-12 top-1/2 -translate-y-1/2 h-8 w-px bg-white/10" />

              <div className="bg-white/5 p-7 rounded-[36px] border border-white/10 flex items-center space-x-4 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/5 transition-all">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center"><Navigation className="text-cyan-500" size={20}/></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Destination</p>
                  <input autoFocus placeholder="Search destination..." value={destination} onChange={e => setDestination(e.target.value)} className="bg-transparent font-black text-white text-xl outline-none w-full" />
                </div>
              </div>

              <button 
                onClick={handleSwap}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all z-10 hover:bg-white/20"
              >
                <ArrowUpDown className="text-white/60" size={18} />
              </button>
            </div>

            <div className="mt-auto pb-12 space-y-4">
              <button onClick={() => setStep('SCHEDULE')} className={`w-full py-5 rounded-[28px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 active:bg-white/10 transition-colors ${isScheduled ? 'text-emerald-400 border-emerald-500/30' : 'text-cyan-400'}`}>
                {isScheduled ? <CalendarCheck size={14}/> : <Calendar size={14}/>}
                <span>{isScheduled ? `Scheduled for ${scheduleDate}, ${scheduleTime}` : 'Schedule for Later'}</span>
                {isScheduled && <Edit2 size={12} className="ml-2 text-white/40" />}
              </button>
              <button disabled={!destination.trim()} onClick={handleDestinationSubmit} className={`w-full py-8 rounded-[36px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all ${destination.trim() ? 'bg-white text-black hover:bg-zinc-200' : 'bg-white/5 text-white/10'}`}>See Ride Options</button>
            </div>
          </motion.div>
        )}

        {step === 'SELECT_VEHICLE' && (
          <motion.div key="vehicles" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute bottom-0 inset-x-0 bg-[#080808] z-[200] rounded-t-[60px] p-10 pb-16 shadow-4xl border-t border-white/10 max-h-[90vh] flex flex-col">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 shrink-0" />
            
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Select Vehicle</h3>
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button onClick={() => setBookingMode(BookingMode.NORMAL)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === BookingMode.NORMAL ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>Normal</button>
                <button onClick={() => setBookingMode(BookingMode.SHARING)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === BookingMode.SHARING ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-white/40'}`}>Sharing</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-10 space-y-3">
              {vehicleOptions.map(v => {
                const fare = calculateOortFare(mockDist, v.type, 1, bookingMode);
                return (
                  <div key={v.type} onClick={() => setVehicle(v.type)} className={`p-6 rounded-[40px] border-2 transition-all cursor-pointer flex items-center justify-between ${vehicle === v.type ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'border-white/5 bg-white/5 opacity-50'}`}>
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center"><v.icon size={26} className={vehicle === v.type ? 'text-cyan-400' : 'text-white/20'}/></div>
                      <div>
                        <h4 className="font-black text-lg text-white tracking-tight">{v.label}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{v.time} • Optimized</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white tracking-tighter">₹{fare.total}</p>
                      {bookingMode === BookingMode.SHARING && <p className="text-[8px] font-black text-emerald-500 uppercase">Save 40%</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-4 shrink-0">
              <button onClick={() => setStep('DESTINATION')} className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10 active:scale-95 transition-transform"><ChevronLeft/></button>
              <button onClick={() => (vehicle !== VehicleType.BIKE) ? setStep('SEAT_SELECT') : handleConfirmRide()} className="flex-1 py-7 rounded-[32px] bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-95">Confirm {vehicle.replace('_', ' ')}</button>
            </div>
          </motion.div>
        )}

        {step === 'SEAT_SELECT' && (
          <motion.div key="seats" initial={{ y: '100%' }} animate={{ y: 0 }} className="absolute inset-0 bg-[#080808] z-[300] p-10 flex flex-col pt-24">
             <div className="flex items-center justify-between mb-12 shrink-0">
               <div className="flex items-center space-x-5">
                 <button onClick={() => setStep('SELECT_VEHICLE')} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90"><ChevronLeft/></button>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Choose Seats</h3>
               </div>
               <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                 {vehicle.replace('_', ' ')}
               </div>
             </div>

             <div className="bg-white/5 rounded-[60px] p-12 border border-white/10 flex-1 flex flex-col items-center overflow-hidden shadow-2xl">
               <div className="flex flex-col items-center mb-10">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Cabin Layout</p>
                 <div className="w-8 h-1 bg-white/10 rounded-full" />
               </div>
               
               <div className="grid grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-2 w-full place-items-center max-h-[50vh] p-4">
                 {getSeatMap(vehicle).map(s => {
                   const isSelected = selectedSeats.includes(s.id);
                   return (
                     <button 
                       key={s.id} 
                       onClick={() => {
                         if (!s.isAvailable) return;
                         setSelectedSeats(prev => {
                           // Ensure at least one seat remains selected
                           if (prev.includes(s.id)) {
                             if (prev.length === 1) return prev;
                             return prev.filter(x => x !== s.id);
                           }
                           return [...prev, s.id];
                         });
                       }} 
                       className={`w-24 h-24 rounded-[36px] border-4 flex flex-col items-center justify-center font-black transition-all duration-300 relative ${!s.isAvailable ? 'bg-white/5 border-white/5 opacity-10 cursor-not-allowed scale-90' : isSelected ? 'bg-cyan-500 border-white text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110 z-10' : 'bg-white/10 border-white/10 text-white/40 hover:bg-white/20 hover:border-white/30'}`}
                     >
                       <span className="text-2xl">{s.label}</span>
                       <span className={`text-[8px] mt-1 font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/20'}`}>{isSelected ? 'Selected' : 'Open'}</span>
                       {isSelected && <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-cyan-500"><Check size={12} className="text-cyan-500" /></div>}
                     </button>
                   );
                 })}
               </div>

               <div className="mt-auto w-full pt-10 border-t border-white/5 flex items-center justify-between shrink-0">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Seats</p>
                    <p className="text-2xl font-black text-white">{selectedSeats.length} <span className="text-xs text-white/40 uppercase">Selected</span></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Payable Fare</p>
                    <p className="text-3xl font-black text-cyan-400 tracking-tighter">₹{fareInfo.total}</p>
                  </div>
               </div>
             </div>

             <button onClick={handleConfirmRide} className="mt-10 shrink-0 w-full py-8 rounded-[38px] bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-4xl active:scale-95 transition-all">
               {isScheduled ? 'Schedule Booking' : 'Book Now'}
             </button>
          </motion.div>
        )}

        {step === 'SCHEDULE' && (
          <motion.div key="schedule" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-black z-[400] p-10 pt-24 flex flex-col">
             <div className="flex items-center space-x-5 mb-16 shrink-0">
               <button onClick={() => setStep('DESTINATION')} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><ChevronLeft/></button>
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Set Departure</h3>
             </div>

             <div className="space-y-12 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
               <div className="space-y-6">
                 <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Select Date</p>
                 <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
                   {['Today', 'Tomorrow', '25 Oct', '26 Oct'].map(d => (
                     <button key={d} onClick={() => setScheduleDate(d)} className={`px-10 py-5 rounded-[28px] border-2 font-black text-sm transition-all whitespace-nowrap ${scheduleDate === d ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/5 bg-white/5 text-white/30 hover:border-white/10'}`}>{d}</button>
                   ))}
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Exact Departure Time</p>
                   <div className="flex items-center space-x-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                     <Timer size={10} className="text-cyan-500" />
                     <span className="text-[8px] font-black text-cyan-500 uppercase">24h Precise</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                    {['08:00', '10:30', '12:00', '15:45', '18:00', '21:30'].map(t => (
                      <button key={t} onClick={() => setScheduleTime(t)} className={`py-5 rounded-[24px] border-2 font-black text-sm transition-all ${scheduleTime === t ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-lg' : 'border-white/5 bg-white/5 text-white/30 hover:border-white/10'}`}>{t}</button>
                    ))}
                 </div>

                 <div className="pt-8 flex flex-col items-center justify-center bg-white/5 rounded-[44px] p-10 border border-white/10 shadow-inner group transition-all hover:bg-white/[0.07]">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Dial-in Custom Time</p>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={scheduleTime} 
                        onChange={e => setScheduleTime(e.target.value)} 
                        className="bg-transparent text-white font-black text-7xl outline-none text-center selection:bg-cyan-500 cursor-pointer hover:text-cyan-400 transition-colors w-full tracking-tighter" 
                      />
                      <div className="absolute -bottom-2 inset-x-0 h-1 bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
                    </div>
                 </div>
               </div>
             </div>

             <div className="mt-8 shrink-0 bg-white/5 p-8 rounded-[44px] border border-white/10 flex items-center justify-between mb-10 shadow-2xl ring-1 ring-white/5">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selected Slot</p>
                 <p className="text-xl font-black text-white uppercase">{scheduleDate}, <span className="text-cyan-400 tabular-nums">{scheduleTime}</span></p>
               </div>
               <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]"><CalendarCheck className="text-cyan-500" size={28} /></div>
             </div>

             <button onClick={() => { setIsScheduled(true); setStep('DESTINATION'); }} className="shrink-0 w-full py-8 rounded-[38px] bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-4xl active:scale-95 transition-all">
               {isScheduled ? 'Update Schedule' : 'Set Departure Time'}
             </button>
             
             {isScheduled && (
               <button onClick={() => { setIsScheduled(false); setStep('DESTINATION'); }} className="mt-4 shrink-0 w-full py-4 text-[10px] font-black text-rose-500/60 uppercase tracking-widest hover:text-rose-500 transition-colors">
                 Remove Schedule
               </button>
             )}
          </motion.div>
        )}

        {step === 'LIVE_TRIP' && driver && (
          <motion.div key="trip" initial={{ y: 200 }} animate={{ y: 0 }} className="absolute bottom-10 inset-x-6 z-[500] space-y-4">
            <div className="bg-black/95 backdrop-blur-3xl rounded-[52px] border border-white/10 p-10 shadow-4xl ring-1 ring-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6">
                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 animate-pulse"><Navigation className="text-cyan-500" size={24}/></div>
               </div>
               
               <div className="flex items-center space-x-5 mb-10">
                  <div className="w-20 h-20 rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl">
                    <img src={driver.photo} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">{driver.name}</h3>
                    <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{driver.vehicleNumber}</p>
                    <div className="flex items-center space-x-1 mt-1"><Star size={12} className="fill-cyan-500 text-cyan-500"/><span className="text-[10px] font-black text-cyan-500">{driver.rating} Rating</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/5 p-5 rounded-[32px] flex items-center space-x-4">
                   <Timer className="text-cyan-500" size={20}/>
                   <div><p className="text-[8px] font-black text-zinc-600 uppercase">Arrival</p><p className="text-lg font-black text-white">{eta} min</p></div>
                 </div>
                 <div className="bg-white/5 p-5 rounded-[32px] flex items-center space-x-4">
                   <Smartphone className="text-emerald-500" size={20}/>
                   <div><p className="text-[8px] font-black text-zinc-600 uppercase">OTP Code</p><p className="text-lg font-black text-white tracking-[0.2em]">1234</p></div>
                 </div>
               </div>

               <div className="flex space-x-4">
                 <button onClick={() => setShowPaymentModal(true)} className="flex-1 py-6 bg-cyan-600 text-white rounded-[28px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-xl shadow-cyan-600/20 active:scale-95 transition-all">
                   <QrCode size={16} /><span>Pay Now</span>
                 </button>
                 <a href={`tel:${driver.phone}`} className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center border border-white/10 active:scale-95 transition-all hover:bg-white/10"><Phone size={24} className="text-emerald-500"/></a>
                 <button onClick={resetApp} className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center border border-white/10 text-rose-500 active:scale-95 transition-transform"><XCircle size={24}/></button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PassengerApp;
