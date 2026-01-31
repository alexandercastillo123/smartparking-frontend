import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-active-reservation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-reservation-card.component.html',
  styleUrls: ['./active-reservation-card.component.scss']
})
export class ActiveReservationCardComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);
  reservation = this.reservationService.activeReservation;

  readonly Math = Math;

  private intervalId: any;
  remainingTime = signal<number>(0);

  // Mensaje dinámico basado en el tiempo
  alertMessage = computed(() => {
    const seconds = this.remainingTime();
    if (seconds <= 0) return '¡Tu reserva ha expirado!';
    if (seconds < 5 * 60) return '¡Casi llegas! Tu tiempo se agota';
    if (seconds < 15 * 60) return 'Llega a tiempo para asegurar tu lugar';
    return 'Reserva confirmada. Te esperamos';
  });

  progressPercentage = computed(() => {
    const total = 30 * 60; // 30 minutos máximo
    const remaining = this.remainingTime();
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  });

  formattedTime = computed(() => {
    const seconds = this.remainingTime();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  isWarning = computed(() => this.remainingTime() < 5 * 60);

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startCountdown(): void {
    this.updateRemainingTime();

    this.intervalId = setInterval(() => {
      this.updateRemainingTime();

      if (this.remainingTime() <= 0) {
        // Podríamos disparar un refresco de datos si expira
        this.reservationService.refreshData();
      }
    }, 1000);
  }

  private updateRemainingTime(): void {
    const res = this.reservation();
    if (!res) {
      this.remainingTime.set(0);
      return;
    }

    const now = new Date().getTime();
    let startTimeStr = String(res.startTime || res.createdAt || '');

    // Normalizar
    if (startTimeStr.includes(' ') && !startTimeStr.includes('T')) {
      startTimeStr = startTimeStr.replace(' ', 'T');
    }
    if (!startTimeStr.endsWith('Z') && !startTimeStr.includes('+') && startTimeStr.length > 10) {
      startTimeStr += 'Z';
    }

    const startTime = new Date(startTimeStr).getTime();
    const tolerance = 30 * 60 * 1000;
    const deadline = isNaN(startTime) ? now + tolerance : startTime + tolerance;

    const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
    this.remainingTime.set(remaining);
  }

  getFormattedStartTime(): string {
    const res = this.reservation();
    if (!res) return '--:--';

    let startTimeStr = String(res.startTime || '');
    if (startTimeStr.includes(' ') && !startTimeStr.includes('T')) {
      startTimeStr = startTimeStr.replace(' ', 'T');
    }
    if (!startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
      startTimeStr += 'Z';
    }

    const date = new Date(startTimeStr);
    if (isNaN(date.getTime())) return '--:--';

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  onCancelReservation(): void {
    const res = this.reservation();
    if (!res) return;

    if (confirm('¿Estás seguro de cancelar tu reserva?')) {
      this.reservationService.cancelReservation(res.reservationId).subscribe({
        next: () => console.log('✅ Reserva cancelada'),
        error: (err: any) => alert('No se pudo cancelar la reserva: ' + err.message)
      });
    }
  }
}
