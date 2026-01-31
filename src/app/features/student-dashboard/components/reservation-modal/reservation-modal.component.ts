import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ParkingSpace, CreateReservationRequest } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-reservation-modal',
  templateUrl: './reservation-modal.component.html',
  styleUrls: ['./reservation-modal.component.scss']
})
export class ReservationModalComponent implements OnInit {
  @Input() spaces: ParkingSpace[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<CreateReservationRequest>();

  selectedDate = '';
  selectedTime = '';
  selectedSpace: ParkingSpace | null = null;
  vehicleInfo = '';
  minDate = '';

  ngOnInit(): void {
    // Set minimum date to today (using local time)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    this.minDate = `${year}-${month}-${day}`;
    this.selectedDate = this.minDate;

    // Set default time to current hour + 1
    const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
    this.selectedTime = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
  }

  canConfirm(): boolean {
    return !!(this.selectedDate && this.selectedTime && this.selectedSpace);
  }

  confirmReservation(): void {
    if (!this.canConfirm()) return;

    // Crear fecha combinada
    const localDateTimeStr = `${this.selectedDate}T${this.selectedTime}:00`;
    const dateObj = new Date(localDateTimeStr);

    // Usar toISOString para enviar formato standar ISO-8601 (ej: 2026-01-30T22:00:00.000Z)
    // El servidor recibirá el tiempo en UTC, que es lo correcto para evitar ambigüedades.
    const startTimeIso = dateObj.toISOString();

    const request: CreateReservationRequest = {
      userId: '', // Will be set by the parent component
      spaceId: this.selectedSpace!.spaceId,
      startTime: startTimeIso,
      // Enviar siempre un valor para vehicleInfo, aunque sea genérico
      vehicleInfo: this.vehicleInfo?.trim() ? this.vehicleInfo : 'Vehículo no especificado'
    };

    this.onConfirm.emit(request);
  }
}
