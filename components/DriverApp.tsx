
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Navigation, User, Phone, X, Activity, Star, Clock, Loader2, AlertCircle, Power, Settings, Landmark, QrCode, Upload, Save, ChevronLeft, CreditCard, Smartphone, Repeat, Navigation2, TrendingUp, Wallet, ArrowUpRight, History, CheckCircle2, MessageSquare, PhoneCall, LogOut, Camera, Check, ArrowRightLeft, CreditCard as CardIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from './MapComponent';
import { RideRequest, RideCategory, VehicleType, BookingMode } from '../types';
import { speakHindi, VOICES } from '../services/voiceService';

type DriverView = 'OFFLINE' | 'DASHBOARD' | 'NAVIGATING' | 'OTP_ENTRY' | 'ARRIVED' | 'ACCOUNT';

interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

interface Transaction {
  id: string;
  type: 'EARNING' | 'COMMISSION' | 'PAYOUT' | 'REFUND' | 'FAILED';
  amount: number;
  timestamp: number;
}

const DriverApp: React.FC = () => {
  const [view, setView] = useState<DriverView>('OFFLINE');
  const [incomingRide, setIncomingRide] = useState<RideRequest | null>(null);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [rideStage, setRideStage] = useState<'PICKUP' | 'DROPOFF'>('PICKUP');
  
  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [requestTimer, setRequestTimer] = useState(15);
  const [distanceToTarget, setDistanceToTarget] = useState(1200);

  // WALLET & BACKEND SYNC LOGIC
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Simulated backend fetch for balance and transactions
  const fetchWalletData = async () => {
    setIsLoadingBalance(true);
    await new Promise(r => setTimeout(r, 800));
    
    const savedTransactions = localStorage.getItem('oortgo_transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      const mockTransactions: Transaction[] = [
        { id: 't1', type: 'EARNING', amount: 450, timestamp: Date.now() - 86400000 },
        { id: 't2', type: 'COMMISSION', amount: -45, timestamp: Date.now() - 86400000 },
        { id: 't3', type: 'EARNING', amount: 320, timestamp: Date.now() - 43200000 },
        { id: 't4', type: 'COMMISSION', amount: -32, timestamp: Date.now() - 43200000 },
        { id: 't5', type: 'PAYOUT', amount: -500, timestamp: Date.now() - 21600000 },
        { id: 't6', type: 'EARNING', amount: 550, timestamp: Date.now() - 10800000 },
        { id: 't7', type: 'COMMISSION', amount: -55, timestamp: Date.now() - 10800000 },
      ];
      setTransactions(mockTransactions);
      localStorage.setItem('oortgo_transactions', JSON.stringify(mockTransactions));
    }
    setIsLoadingBalance(false);
  };

  const totalNetBalance = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'FAILED') return acc;
      return acc + curr.amount;
    }, 0);
  }, [transactions]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('oortgo_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const [driverPhoto, setDriverPhoto] = useState<string | null>(() => localStorage.getItem('oortgo_driver_photo'));
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => {
    const saved = localStorage.getItem('oortgo_bank_details');
    return saved ? JSON.parse(saved) : {
      accountName: 'Rahul Kumar', 
      bankName: 'HDFC Bank', 
      accountNumber: '5010042XXXX4492', 
      ifsc: 'HDFC0001234', 
      upiId: 'rahulk@upi'
    };
  });
  const [upiQr, setUpiQr] = useState<string | null>(() => localStorage.getItem('oortgo_upi_qr'));
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const upiFileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (view === 'NAVIGATING' && activeRide) {
      interval = setInterval(() => {
        setDistanceToTarget(prev => {
          const next = Math.max(0, prev - 30);
          if (next === 0 && rideStage === 'PICKUP') {
            setView('OTP_ENTRY');
            speakHindi(VOICES.NAV_ARRIVED_PICKUP);
          } else if (next === 0 && rideStage === 'DROPOFF') {
            speakHindi(VOICES.NAV_ARRIVED_DROPOFF);
            const earning = activeRide?.fare || 0;
            const commission = -(earning * 0.1);
            setTransactions(prev => [
              ...prev, 
              { id: `ride_${Date.now()}`, type: 'EARNING', amount: earning, timestamp: Date.now() },
              { id: `comm_${Date.now()}`, type: 'COMMISSION', amount: commission, timestamp: Date.now() }
            ]);
            setTimeout(() => {
              setView('DASHBOARD');
              setActiveRide(null);
            }, 3000);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, activeRide, rideStage]);

  useEffect(() => {
    if (view === 'DASHBOARD' && !activeRide && !incomingRide) {
      const timer = setTimeout(() => {
        setIncomingRide({
          id: 'req_101',
          passengerId: 'p1',
          passengerName: 'Anjali Sharma',
          passengerPhone: '+91 9988776655',
          pickup: 'Terminal 3, IGI Airport',
          destination: 'Connaught Place, Block B',
          category: RideCategory.PRIVATE,
          vehicleType: VehicleType.CAR_SEDAN,
          bookingMode: BookingMode.NORMAL,
          fare: 450,
          status: 'PENDING',
          distance: '1.2km',
          duration: '25m',
          otp: '1234'
        });
        setRequestTimer(15);
        speakHindi("Aapke liye naya ride request hai.");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [view, activeRide, incomingRide]);

  const handleAccept = () => {
    if (incomingRide) {
      setActiveRide(incomingRide);
      setIncomingRide(null);
      setRideStage('PICKUP');
      setView('NAVIGATING');
      setDistanceToTarget(1200);
      speakHindi("Ride accept ho gayi hai.");
    }
  };

  const handleVerifyOTP = async (val: string) => {
    if (val.length > 4) return;
    setOtpValue(val);
    if (val.length === 4) {
      setIsVerifying(true);
      await new Promise(res => setTimeout(res, 800));
      if (val === activeRide?.otp) {
        setIsOtpVerified(true);
        speakHindi("Code sahi hai.");
      } else {
        setOtpError(true);
        speakHindi("Ghalat code.");
        setTimeout(() => { setOtpError(false); setOtpValue(''); }, 1000);
      }
      setIsVerifying(false);
    }
  };

  const handleStartRide = () => {
    if (!isOtpVerified) return;
    speakHindi(VOICES.TRIP_STARTED);
    setRideStage('DROPOFF');
    setDistanceToTarget(5000);
    setIsOtpVerified(false);
    setOtpValue('');
    setView('NAVIGATING');
  };

  const validatePayoutInfo = (): string | null => {
    if (!bankDetails.accountName.trim()) return "Account holder name is required.";
    if (!bankDetails.bankName.trim()) return "Bank name is required.";
    if (!/^\d{9,18}$/.test(bankDetails.accountNumber)) return "Invalid bank account number (9-18 digits required).";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc)) return "Invalid IFSC format (e.g., HDFC0001234).";
    if (bankDetails.upiId && !/^[\w.-]+@[\w.-]+$/.test(bankDetails.upiId)) return "Invalid UPI ID format.";
    return null;
  };

  const handleSaveAccount = async () => {
    setValidationError(null);
    const error = validatePayoutInfo();
    if (error) {
      setValidationError(error);
      speakHindi("Kripya sahi jaankari bhare.");
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    localStorage.setItem('oortgo_bank_details', JSON.stringify(bankDetails));
    if (upiQr) localStorage.setItem('oortgo_upi_qr', upiQr);
    if (driverPhoto) localStorage.setItem('oortgo_driver_photo', driverPhoto);
    
    setIsSaving(false);
    setSaveSuccess(true);
    speakHindi("Details save ho gayi hain.");
    setTimeout(() => {
      setSaveSuccess(false);
      setView('DASHBOARD');
    }, 1200);
  };

  const handleTransferToBank = async () => {
    if (totalNetBalance <= 0) {
      speakHindi("Aapka balance kam hai.");
      return;
    }
    
    setIsLoadingBalance(true);
    await new Promise(r => setTimeout(r, 1500));
    const payoutAmount = -totalNetBalance;
    const payoutTransaction: Transaction = { id: `payout_${Date.now()}`, type: 'PAYOUT', amount: payoutAmount, timestamp: Date.now() };
    setTransactions(prev => [...prev, payoutTransaction]);
    setIsLoadingBalance(false);
    speakHindi("Paisay transfer kar diye gaye hain.");
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setDriverPhoto(base64);
        localStorage.setItem('oortgo_driver_photo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpiQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUpiQr(base64);
        localStorage.setItem('oortgo_upi_qr', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white relative overflow-hidden font-['Inter']">
      <div className="absolute inset-0 z-0 h-full w-full">
        <MapComponent 
          mode="DRIVER"
          pickupLocation={rideStage === 'PICKUP' ? { lat: 28.5562, lng: 77.1000, label: activeRide?.pickup || '' } : null}
          targetLocation={rideStage === 'DROPOFF' ? { lat: 28.6289, lng: 77.2150, label: activeRide?.destination || '' } : null}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      </div>

      <AnimatePresence>
        {view === 'OFFLINE' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-10 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-10 border border-white/10 shadow-2xl"><Power className="w-10 h-10 text-white/20" /></div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Offline</h2>
            <button onClick={() => setView('DASHBOARD')} className="w-full bg-cyan-500 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-transform">Go Online</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'ACCOUNT' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-[#050505] z-[500] flex flex-col p-8 pt-20 overflow-y-auto no-scrollbar pb-32">
            <div className="flex items-center justify-between mb-10">
              <button onClick={() => setView('DASHBOARD')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><ChevronLeft/></button>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">Profile & Wallet</h2>
              <div className="w-12" />
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center mb-12">
              <div className="relative group">
                <div className="w-32 h-32 bg-white/5 rounded-[44px] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                  {driverPhoto ? (
                    <img src={driverPhoto} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-white/10" />
                  )}
                </div>
                <button 
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-cyan-500 rounded-3xl flex items-center justify-center border-4 border-black shadow-xl active:scale-90 transition-all z-20"
                >
                  <Camera size={20} />
                </button>
                <input type="file" ref={profileFileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-tight">{bankDetails.accountName}</h3>
              <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 mt-2">
                 <CheckCircle2 size={12} className="text-emerald-500" />
                 <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Verified Partner</span>
              </div>
            </div>

            {/* Net Earnings Card - CENTERED & FIXED UI */}
            <div className="bg-gradient-to-br from-[#0052D4] via-[#4364F7] to-[#6FB1FC] p-8 md:p-10 rounded-[52px] shadow-4xl mb-12 relative overflow-hidden border border-white/20 group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-colors" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

               <div className="relative z-10 flex flex-col items-center text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 mb-4">Total Net Balance</p>
                 
                 <div className="flex items-center justify-center w-full mb-8">
                   {isLoadingBalance ? (
                     <Loader2 className="w-10 h-10 text-white animate-spin" />
                   ) : (
                     <div className="flex items-baseline justify-center">
                        <span className="text-3xl md:text-4xl font-black text-white/80 mr-2 drop-shadow-md">₹</span>
                        <p className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                          {totalNetBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                     </div>
                   )}
                 </div>

                 <div className="grid grid-cols-2 gap-3 w-full mb-10">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
                       <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Commission</p>
                       <p className="text-sm font-black text-white">10%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
                       <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-[9px] font-black text-white uppercase tracking-tighter">Verified</p>
                    </div>
                 </div>

                 <div className="flex space-x-3 w-full">
                    <button 
                      onClick={handleTransferToBank}
                      disabled={isLoadingBalance || totalNetBalance <= 0}
                      className="flex-1 bg-white text-blue-600 py-6 rounded-[30px] font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                       {isLoadingBalance ? <Loader2 className="animate-spin w-4 h-4" /> : <><ArrowRightLeft size={16} /><span>Transfer to Bank</span></>}
                    </button>
                    <button className="w-20 bg-black/20 backdrop-blur-md text-white rounded-[30px] flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-lg hover:bg-black/30">
                       <History size={24} />
                    </button>
                 </div>
               </div>
            </div>

            {/* Validation Feedback */}
            {validationError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-center space-x-4">
                <AlertCircle size={20} className="text-rose-500 shrink-0" />
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{validationError}</p>
              </motion.div>
            )}

            {/* Payout & Bank Details */}
            <div className="space-y-8">
              <div className="bg-white/5 p-10 rounded-[52px] border border-white/10 space-y-8 shadow-inner">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20"><Landmark className="text-cyan-500" size={18} /></div>
                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Bank Details</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase ml-4">Account Holder Name</p>
                    <input 
                      value={bankDetails.accountName} 
                      onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} 
                      className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-bold text-white outline-none focus:border-cyan-500/50 transition-colors" 
                      placeholder="e.g. Rahul Kumar" 
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase ml-4">Bank Name</p>
                    <input 
                      value={bankDetails.bankName} 
                      onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} 
                      className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-bold text-white outline-none focus:border-cyan-500/50 transition-colors" 
                      placeholder="e.g. HDFC Bank" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-zinc-600 uppercase ml-4">Account Number</p>
                      <input 
                        value={bankDetails.accountNumber} 
                        onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value.replace(/\D/g, '')})} 
                        className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-bold text-white outline-none focus:border-cyan-500/50 transition-colors tabular-nums" 
                        placeholder="Numeric only" 
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-zinc-600 uppercase ml-4">IFSC Code</p>
                      <input 
                        value={bankDetails.ifsc} 
                        onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value.toUpperCase()})} 
                        className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-bold text-white outline-none focus:border-cyan-500/50 transition-colors uppercase" 
                        placeholder="HDFC0001234" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* UPI Section */}
              <div className="bg-white/5 p-10 rounded-[52px] border border-white/10 space-y-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20"><QrCode className="text-cyan-500" size={18} /></div>
                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">UPI ID & QR</p>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-bold text-zinc-600 uppercase ml-4">UPI ID</p>
                   <input 
                     value={bankDetails.upiId} 
                     onChange={e => setBankDetails({...bankDetails, upiId: e.target.value})} 
                     className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-bold text-white outline-none focus:border-cyan-500/50 transition-colors" 
                     placeholder="rahulk@upi" 
                   />
                </div>
                
                <div 
                  onClick={() => upiFileInputRef.current?.click()}
                  className="aspect-square w-full max-w-[280px] mx-auto bg-white/5 border-2 border-dashed border-white/10 rounded-[44px] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-cyan-500/40 transition-all shadow-inner"
                >
                  {upiQr ? (
                    <img src={upiQr} className="w-full h-full object-contain p-6" />
                  ) : (
                    <>
                      <Upload className="text-white/10 mb-2 group-hover:text-cyan-500 transition-colors" />
                      <p className="text-[10px] font-black text-white/30 uppercase">Upload UPI QR</p>
                    </>
                  )}
                </div>
                <input type="file" ref={upiFileInputRef} onChange={handleUpiQrChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="mt-16 space-y-6">
              <button 
                disabled={isSaving} 
                onClick={handleSaveAccount} 
                className={`w-full py-8 rounded-[40px] font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center space-x-3 shadow-4xl transition-all active:scale-95 ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-black'}`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <Check /> : <><Save size={20} /><span>Save Payout Details</span></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto p-6 pb-12 z-50">
        <AnimatePresence mode="wait">
          {view === 'DASHBOARD' && !incomingRide && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="flex flex-col items-center py-10">
               <div className="w-full flex justify-between items-center mb-10 px-4">
                 <button onClick={() => setView('ACCOUNT')} className="flex items-center space-x-4 bg-black/90 backdrop-blur-3xl border border-white/10 p-3 pr-8 rounded-[36px] active:scale-95 transition-all shadow-4xl ring-1 ring-white/5">
                    <div className="w-14 h-14 rounded-[24px] bg-white/10 overflow-hidden border border-white/10">
                      {driverPhoto ? <img src={driverPhoto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-white/20" />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-white tracking-tight">{bankDetails.accountName}</p>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Online • Searching</p>
                    </div>
                 </button>
                 
                 <button onClick={() => setView('ACCOUNT')} className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[28px] flex items-center justify-center border border-white/10 relative active:scale-90 transition-all">
                   <Wallet className="w-7 h-7 text-white/60" />
                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full border-4 border-black flex items-center justify-center text-[10px] font-black animate-pulse">!</div>
                 </button>
               </div>
               
               <div className="w-28 h-28 bg-cyan-500/10 rounded-full flex items-center justify-center relative mb-10">
                 <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping" />
                 <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/40 border-4 border-white/10">
                    <Activity className="w-10 h-10 text-white" />
                 </div>
               </div>
               <p className="text-sm font-black text-zinc-500 tracking-[0.4em] uppercase">Scanning Nearby Requests</p>
               <button onClick={() => setView('OFFLINE')} className="mt-12 text-white/10 text-[11px] font-black uppercase tracking-widest border border-white/5 px-10 py-5 rounded-full hover:text-white hover:bg-white/5 transition-all">Switch Offline</button>
            </motion.div>
          )}

          {incomingRide && (
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} className="bg-white rounded-[60px] p-12 text-black shadow-4xl relative overflow-hidden">
              <div className="absolute top-0 left-0 h-2.5 bg-cyan-500" style={{ width: `${(requestTimer / 15) * 100}%` }} />
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2">{incomingRide.passengerName}</h2>
                  <div className="flex items-center space-x-2">
                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Incoming {incomingRide.vehicleType.replace('_', ' ')}</p>
                    {incomingRide.bookingMode === BookingMode.SHARING && <span className="bg-cyan-100 text-cyan-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Shared Ride</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black text-emerald-600 tracking-tighter tabular-nums">₹{incomingRide.fare}</p>
                </div>
              </div>
              <div className="flex space-x-5">
                <button onClick={() => setIncomingRide(null)} className="flex-1 py-8 bg-zinc-100 text-zinc-400 rounded-[38px] font-black uppercase text-xs tracking-widest active:scale-95 transition-transform">Ignore</button>
                <button onClick={handleAccept} className="flex-[2] py-8 bg-black text-white rounded-[38px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl active:scale-95 transition-transform">Accept Ride</button>
              </div>
            </motion.div>
          )}

          {view === 'OTP_ENTRY' && activeRide && (
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} className="bg-zinc-950 rounded-[60px] border border-white/10 p-12 shadow-4xl text-center">
              <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">Enter OTP Code</h3>
              <p className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-12">Ask passenger for Ride Verification OTP</p>
              <div className={`flex justify-center space-x-5 mb-14 ${otpError ? 'animate-bounce' : ''}`}>
                <input autoFocus type="tel" maxLength={4} value={otpValue} onChange={(e) => handleVerifyOTP(e.target.value)} className="w-full max-w-[320px] bg-white/5 border-2 border-white/10 rounded-[40px] py-10 text-6xl text-center font-black tracking-[0.5em] text-cyan-400 outline-none focus:border-cyan-500 transition-colors shadow-inner tabular-nums" placeholder="••••" />
              </div>
              <button disabled={!isOtpVerified || isVerifying} onClick={handleStartRide} className={`w-full py-9 rounded-[40px] font-black uppercase tracking-[0.4em] text-sm transition-all flex items-center justify-center space-x-4 ${isOtpVerified ? 'bg-white text-black shadow-4xl' : 'bg-white/5 text-white/10'}`}>
                {isVerifying ? <Loader2 className="animate-spin" /> : <><span>Start Trip</span><ArrowUpRight size={24} /></>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {view === 'NAVIGATING' && activeRide && (
          <>
            <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="absolute top-20 inset-x-6 z-[100]">
              <div className="bg-black/95 backdrop-blur-3xl p-7 rounded-[40px] border border-white/10 shadow-4xl flex items-center justify-between ring-1 ring-white/10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-cyan-500 rounded-[24px] flex items-center justify-center shadow-xl shadow-cyan-500/30"><Navigation className="w-8 h-8 text-white rotate-45" /></div>
                  <div>
                    <p className="text-[10px] font-black text-cyan-500 uppercase mb-1 tracking-widest">{rideStage === 'PICKUP' ? 'Nav to Pickup' : 'Driving to Destination'}</p>
                    <h3 className="text-xl font-black text-white tracking-tighter truncate max-w-[160px]">{rideStage === 'PICKUP' ? activeRide.pickup : activeRide.destination}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-cyan-400 tabular-nums">{(distanceToTarget / 1000).toFixed(1)} <span className="text-sm">km</span></p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="absolute bottom-10 inset-x-6 z-[100]">
              <div className="bg-white rounded-[52px] p-10 shadow-4xl space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-zinc-100 rounded-[24px] flex items-center justify-center border border-zinc-200 shadow-inner"><User className="w-8 h-8 text-zinc-400" /></div>
                    <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Ride for</p><h4 className="text-3xl font-black text-black tracking-tighter">{activeRide.passengerName}</h4></div>
                  </div>
                  <a href={`tel:${activeRide.passengerPhone}`} className="w-16 h-16 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-emerald-500/20 active:scale-90 transition-all"><PhoneCall size={28} /></a>
                </div>
                {rideStage === 'PICKUP' && <button onClick={() => setView('OTP_ENTRY')} className="w-full py-7 bg-black text-white rounded-[36px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl active:bg-zinc-800 transition-colors">Confirm Arrival</button>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverApp;
