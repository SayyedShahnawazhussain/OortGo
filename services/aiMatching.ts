
import { VehicleType, RideCategory, BookingMode } from '../types';

/**
 * OortGo Strict Pricing Configuration
 * Based on distance only: 0-3km is fixed, thereafter per-km.
 */
const PRICING_CONFIG = {
  [VehicleType.BIKE]: { fixed: 15, perKm: 3 },
  [VehicleType.AUTO]: { fixed: 30, perKm: 5 },
  [VehicleType.XL_7SEATER]: { fixed: 30, perKm: 4 }, // Per seat (Eco 7-Seater)
  [VehicleType.CAR_SEDAN]: { fixed: 50, perKm: 6 }, // Car (4-seater)
};

export interface FareResult {
  total: number;
  breakdown: string;
  isShortZone: boolean;
  savingsVsPrivate: number;
  fixedPart: number;
  extraPart: number;
  sharingSavings?: number;
}

/**
 * Calculates fare based on strict OortGo rules.
 * Supports NORMAL and SHARING modes.
 */
export const calculateOortFare = (
  distanceKm: number, 
  type: VehicleType, 
  seatCount: number = 1,
  mode: BookingMode = BookingMode.NORMAL
): FareResult => {
  const config = PRICING_CONFIG[type] || PRICING_CONFIG[VehicleType.CAR_SEDAN];
  const isShortZone = distanceKm <= 3;
  
  let fixedPart = config.fixed;
  let extraPart = 0;

  if (!isShortZone) {
    extraPart = (distanceKm - 3) * config.perKm;
  }

  let total = fixedPart + extraPart;

  // Multiply by seats for specific vehicle types
  if (type === VehicleType.XL_7SEATER || type === VehicleType.CAR_SEDAN) {
    total = total * seatCount;
  }

  // Apply Sharing Discount if in SHARING mode
  let sharingSavings = 0;
  if (mode === BookingMode.SHARING) {
    const originalTotal = total;
    // Sharing is 40% cheaper for the passenger
    total = total * 0.6;
    sharingSavings = originalTotal - total;
  }

  const breakdown = isShortZone 
    ? `Fixed Short-Distance Fare (0-3km)`
    : `₹${fixedPart} (First 3km) + ₹${extraPart.toFixed(1)} extra distance`;

  // Mock private fare comparison (Legacy apps like Uber/Ola)
  const privateBase = 60;
  const privateKm = type === VehicleType.BIKE ? 12 : 25;
  const privateTotal = privateBase + (distanceKm * privateKm);

  return {
    total: Math.round(total),
    breakdown,
    isShortZone,
    savingsVsPrivate: Math.round(privateTotal - total),
    fixedPart,
    extraPart: Math.round(extraPart),
    sharingSavings: Math.round(sharingSavings)
  };
};

/**
 * Simulates the AI checking for a vehicle on the SAME ROAD and SAME DIRECTION.
 * Returns availability for both Normal and Sharing modes.
 */
export const checkVehicleAvailability = async (type: VehicleType): Promise<{ 
  available: boolean; 
  sharingAvailable: boolean;
  eta: number;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 85% chance of finding a normal vehicle
  const isAvailable = Math.random() > 0.15;
  
  // Sharing only available if a vehicle is already on the same road (60% chance)
  const isSharingAvailable = isAvailable && Math.random() > 0.4;
  
  return {
    available: isAvailable,
    sharingAvailable: isSharingAvailable,
    eta: Math.floor(Math.random() * 5) + 2
  };
};

export const getSeatMap = (type: VehicleType): { id: string, isAvailable: boolean, label: string }[] => {
  const counts: Record<string, number> = {
    [VehicleType.BIKE]: 1,
    [VehicleType.AUTO]: 3,
    [VehicleType.CAR_SEDAN]: 4,
    [VehicleType.XL_7SEATER]: 7,
  };
  
  const count = counts[type] || 4;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i+1}`,
    isAvailable: Math.random() > 0.3, // Simulate real-time occupancy
    label: `${i + 1}`
  }));
};
