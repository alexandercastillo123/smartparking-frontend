export interface ParkingSpace {
  spaceId: string;
  code: string;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  currentReservationId?: string;
  lastUpdated?: Date;
  createdAt: Date;
}

export interface Reservation {
  reservationId: string;
  userId?: string;
  spaceCode: string;
  startTime: string | Date;
  endTime?: string | Date;
  date: string | Date;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  vehicleInfo?: string;
  specialRequirements?: string;
  totalCost?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string | Date;
  confirmedAt?: string | Date;
  cancelledAt?: string | Date;
  completedAt?: string | Date;
  cancellationReason?: string;
}

export interface ActiveReservation {
  reservationId: string;
  spaceCode: string;
  startTime: string | Date;
  endTime?: string | Date;
  status: string;
  vehicleInfo?: string;
  specialRequirements?: string;
  minutesUntilArrival: number;
  canCancel: boolean;
}

export interface ReservationHistory {
  reservationId: string;
  userEmail?: string;
  userName?: string;
  spaceCode: string;
  startTime: string | Date;
  endTime?: string | Date;
  date: string | Date;
  status: string;
  vehicleInfo?: string;
  specialRequirements?: string;
  totalCost: number;
  completedAt?: string | Date;
  cancelledAt?: string | Date;
  cancellationReason?: string;
}

export interface AbsenceCounter {
  userId: string;
  absenceCount: number;
  strikeCount: number;
  maxStrikes: number;
  lastUpdated: string | Date;
  status: 'safe' | 'warning' | 'danger' | 'suspended';
  message: string;
}

export interface CreateReservationRequest {
  userId: string;
  spaceId: string;
  startTime: string | Date;
  vehicleInfo?: string;
  specialRequirements?: string;
}

export interface CancelReservationRequest {
  reason?: string;
}
