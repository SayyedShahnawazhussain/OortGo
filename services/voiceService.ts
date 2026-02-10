
/**
 * Localized Voice Service for OortGo
 * Handles background-compatible TTS for Hindi and English notifications.
 */

export const speakHindi = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang.includes('hi-IN'));
  
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }
  
  utterance.lang = 'hi-IN';
  utterance.rate = 1.05; 
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
};

// Common Cues
export const VOICES = {
  PASSENGER_30M_REMAINDER: "Aapki ride tees minute mein hai, kripya ready rahiye. Driver tees minute mein aane wala hai.",
  PASSENGER_ARRIVAL_2M: "Aapka destination doh minute mein aane wala hai",
  PASSENGER_CANCELLED_CONFIRM: "Aapki ride cancel ho gayi hai",
  DRIVER_PICKUP_REACHED: "Aap pickup point par pahunch gaye hain. Passenger yahan par hai.",
  DRIVER_SCHEDULED_TASK: "Aaj aapko yahan jana hai",
  DRIVER_RIDE_CANCELLED: "Passenger ne ride cancel kar di hai",
  TRIP_STARTED: "O T P verify ho gaya hai. Trip shuru ho gayi hai. Shubh yatra.",
  RIDE_STARTED_HINDI: "Ride shuru ho chuki hai",
  
  // Navigation Cues
  NAV_TURN_LEFT_200: "Doh-sau meter baad baayen mudiye",
  NAV_TURN_RIGHT_200: "Doh-sau meter baad daayen mudiye",
  NAV_TURN_LEFT_NOW: "Ab baayen mudiye",
  NAV_TURN_RIGHT_NOW: "Ab daayen mudiye",
  NAV_GO_STRAIGHT: "Agli chowk tak seedhe chaliye",
  NAV_ARRIVED_PICKUP: "Aap pickup location par pahunch gaye hain. Kripya passenger se security code maange.",
  NAV_ARRIVED_DROPOFF: "Aap destination par pahunch gaye hain. Trip poori ho gayi hai poori ho gayi hai."
};
