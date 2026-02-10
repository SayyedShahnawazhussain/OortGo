
export enum AppView {
  SPLASH = 'SPLASH',
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER'
}

export enum VehicleType {
  BIKE = 'BIKE',
  AUTO = 'AUTO',
  CAR_SEDAN = 'CAR_SEDAN',
  XL_7SEATER = 'XL_7SEATER'
}

export enum RideCategory {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  INTERCITY = 'INTERCITY'
}

export enum BookingMode {
  NORMAL = 'NORMAL',
  SHARING = 'SHARING'
}

export interface Seat {
  id: string;
  isAvailable: boolean;
  label: string;
}

export interface ScheduledRide {
  id: string;
  pickup: string;
  destination: string;
  time: string;
  date: string;
  vehicleType: VehicleType;
  isFlexible?: boolean;
}

export interface DriverDetails {
  name: string;
  photo: string;
  phone: string;
  vehicleNumber: string;
  rating: number;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiQr?: string; // Base64 or URL
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  pickup: string;
  destination: string;
  category: RideCategory;
  vehicleType: VehicleType;
  bookingMode: BookingMode;
  fare: number;
  status: string;
  distance: string;
  duration: string;
  otp?: string;
}
