import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map, timer, switchMap, startWith } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reservation, ActiveSession, ParkingSpace, ActiveReservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);

  // === PROPIEDADES PARA HTTP ===
  private basepath: string = `${environment.apiUrl}`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  // Signals para manejo reactivo de estado
  private parkingSpacesSignal = signal<ParkingSpace[]>([]);
  private activeReservationSignal = signal<ActiveReservation | null>(null);
  private activeSessionSignal = signal<ActiveSession | null>(null);

  // Computed signals
  parkingSpaces = this.parkingSpacesSignal.asReadonly();
  activeReservation = this.activeReservationSignal.asReadonly();
  activeSession = this.activeSessionSignal.asReadonly();

  hasActiveReservation = computed(() => this.activeReservationSignal() !== null);
  hasActiveSession = computed(() => this.activeSessionSignal() !== null);

  constructor() {
    this.refreshData();
    // Refrescar espacios cada 30 segundos
    timer(0, 30000).subscribe(() => this.fetchParkingSpaces().subscribe());
  }

  refreshData() {
    this.fetchParkingSpaces().subscribe();
    this.fetchActiveReservation().subscribe();
  }

  /**
   * Obtener todos los espacios desde el backend
   */
  fetchParkingSpaces(): Observable<ParkingSpace[]> {
    return this.http.get<ParkingSpace[]>(`${this.basepath}/space-iot/parking-spaces`, this.httpOptions)
      .pipe(
        tap(spaces => this.parkingSpacesSignal.set(spaces)),
        catchError(err => {
          console.error('Error fetching parking spaces', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Obtener la reserva activa del usuario
   */
  fetchActiveReservation(): Observable<ActiveReservation | null> {
    return this.http.get<ActiveReservation>(`${this.basepath}/reservation/active`, this.httpOptions)
      .pipe(
        tap(res => {
          if (res) {
            this.activeReservationSignal.set(res);
            if (res.status === 'active') {
              // Convertir a ActiveSession si ya está activa (usuario llegó)
              this.setActiveSessionFromReservation(res);
            }
          } else {
            this.activeReservationSignal.set(null);
            this.activeSessionSignal.set(null);
          }
        }),
        catchError(err => {
          if (err.status === 204) {
            this.activeReservationSignal.set(null);
            return new Observable<null>(obs => obs.next(null));
          }
          return throwError(() => err);
        })
      );
  }

  private setActiveSessionFromReservation(res: ActiveReservation) {
    // Si la reserva está 'active', significa que el usuario ya está ocupando el lugar
    const session: ActiveSession = {
      id: res.reservationId,
      reservationId: res.reservationId,
      spaceId: res.spaceCode,
      spaceName: `Espacio ${res.spaceCode}`,
      startedAt: this.parseDate(res.startTime || res.createdAt),
      elapsedTime: 0
    };
    this.activeSessionSignal.set(session);
    this.startSessionTimer();
  }

  private parseDate(dateStr: string | Date | undefined | null): Date {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;

    let str = dateStr.toString().trim();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }

    // Si no tiene zona horaria, forzamos UTC
    if (!str.endsWith('Z') && !str.includes('+') && str.length > 10) {
      str += 'Z';
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      const fallback = new Date(dateStr.toString());
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    }
    return d;
  }

  /**
   * Crear una nueva reserva
   */
  createReservation(spaceCode: string): Observable<Reservation> {
    const request = {
      spaceCode: spaceCode,
      startTime: new Date().toISOString()
    };

    return this.http.post<Reservation>(`${this.basepath}/reservation`, request, this.httpOptions)
      .pipe(
        tap(() => this.refreshData()),
        catchError(err => {
          console.error('Error creating reservation', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Crear una reserva con detalles específicos (fecha, hora, usuario)
   */
  createReservationHttp(request: any): Observable<any> {
    return this.http.post<any>(`${this.basepath}/reservation`, request, this.httpOptions)
      .pipe(
        tap(() => this.refreshData()),
        catchError(err => {
          console.error('Error creating reservation (HTTP)', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Confirmar reserva (llegada)
   */
  confirmArrival(reservationId: string): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.basepath}/reservation/${reservationId}/confirm`, {}, this.httpOptions)
      .pipe(
        tap(() => this.refreshData())
      );
  }

  /**
   * Activar reserva (cuando el sensor detecta presencia o manual)
   */
  activateReservation(reservationId: string): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.basepath}/reservation/${reservationId}/activate`, {}, this.httpOptions)
      .pipe(
        tap(() => this.refreshData())
      );
  }

  /**
   * Cancelar reserva
   */
  cancelReservation(reservationId: string, reason: string = 'Cancelado por usuario'): Observable<any> {
    return this.http.post(`${this.basepath}/reservation/${reservationId}/cancel`, { cancellationReason: reason }, this.httpOptions)
      .pipe(
        tap(() => {
          this.activeReservationSignal.set(null);
          this.refreshData();
        })
      );
  }

  /**
   * Finalizar sesión (completar reserva)
   */
  endSession(reservationId: string): Observable<any> {
    // FIX: Add responseType: 'text' to handle non-JSON responses
    return this.http.post(`${this.basepath}/reservation/${reservationId}/complete`, {}, { ...this.httpOptions, responseType: 'text' as 'json' })
      .pipe(
        tap(() => {
          this.activeSessionSignal.set(null);
          this.activeReservationSignal.set(null);
          this.refreshData();
        })
      );
  }

  /**
   * Historial de reservas
   */
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.basepath}/reservation/history`, this.httpOptions);
  }

  /**
   * Iniciar cronómetro de sesión activa
   */
  private startSessionTimer(): void {
    const intervalId = setInterval(() => {
      this.activeSessionSignal.update(session => {
        if (!session) {
          clearInterval(intervalId);
          return null;
        }
        const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
        return { ...session, elapsedTime: elapsed };
      });
    }, 1000);
  }
}
