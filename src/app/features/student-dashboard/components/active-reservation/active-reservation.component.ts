import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject, takeUntil } from 'rxjs';
import { ActiveReservation } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-active-reservation',
  templateUrl: './active-reservation.component.html',
  styleUrls: ['./active-reservation.component.scss']
})
export class ActiveReservationComponent implements OnInit, OnDestroy {
  @Input() reservation!: ActiveReservation;
  @Output() onCancel = new EventEmitter<string>();
  @Output() onSimulateArrival = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  remainingSeconds = 0;

  ngOnInit(): void {
    this.updateRemainingTime();

    // Update every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRemainingTime();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getStartTimeMs(): number {
    const st = this.reservation.startTime;

    // Si ya es un objeto Date
    if (st instanceof Date && !isNaN(st.getTime())) {
      return st.getTime();
    }

    // Intentar parsear si es string
    if (typeof st === 'string' || st instanceof String) {
      let str = st.toString().trim();

      // Si parece formato ISO naive "YYYY-MM-DD HH:mm:ss"
      if (str.includes(' ') && !str.includes('T')) {
        str = str.replace(' ', 'T');
      }

      // Forzar UTC si no tiene zona horaria
      if (!str.endsWith('Z') && !str.includes('+')) {
        str += 'Z';
      }

      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed.getTime();
      }
    }

    // Fallback extremadamente robusto: intentar parsear lo que sea
    const fallback = new Date(st as any);
    if (!isNaN(fallback.getTime())) {
      return fallback.getTime();
    }

    // Si todo falla, devolver el tiempo de inicio de la reserva original del modelo 
    // (o 0 para evitar el 'efecto 30:00' si realmente no hay fecha)
    return 0;
  }

  updateRemainingTime(): void {
    const now = Date.now();
    const startTime = this.getStartTimeMs();

    // Contar regresivamente hasta la hora de inicio (9:00 PM), NO hasta 9:30 PM
    const diff = startTime - now;
    this.remainingSeconds = Math.max(0, Math.floor(diff / 1000));
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getProgressPercentage(): number {
    const totalSeconds = 30 * 60; // 30 minutes
    // Cap at 100% and ensure it doesn't go below 0%
    return Math.min(100, Math.max(0, (this.remainingSeconds / totalSeconds) * 100));
  }

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'active': 'Activa'
    };
    return labels[this.reservation.status] || this.reservation.status;
  }

  getFormattedStartTime(): string {
    const date = new Date(this.getStartTimeMs());
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }
}
