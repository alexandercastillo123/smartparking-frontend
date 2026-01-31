// src/app/features/dashboard/models/reservation.model.ts

export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type SpaceStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';

export interface ParkingSpace {
  spaceId: string;
  code: string;
  status: SpaceStatus;
  currentReservationId?: string;
  lastUpdated?: string;
}

export interface Reservation {
  reservationId: string;
  spaceCode: string;
  startTime: string;
  endTime?: string;
  date?: string;
  status: ReservationStatus;
  vehicleInfo?: string;
  specialRequirements?: string;
  totalCost?: number;
  paymentStatus?: string;
  createdAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  cancellationReason?: string;
}

export interface ActiveReservation extends Reservation {
  minutesUntilArrival: number;
  canCancel: boolean;
}

export interface ActiveSession {
  id: string;
  reservationId: string;
  spaceId: string;
  spaceName: string;
  startedAt: Date;
  elapsedTime: number; // en segundos
}
