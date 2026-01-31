import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject, takeUntil } from 'rxjs';
import { ReservationService } from '../../../../shared/services/reservation.service';
import { ParkingSpaceService } from '../../../../shared/services/parking-space.service';
import { AbsenceService } from '../../../../shared/services/absence.service';
import { IoTSimulationService } from '../../../../shared/services/iot-simulation.service';
import { AuthenticationService } from '../../../iam/services/authentication.service';
import {
  ParkingSpace,
  ActiveReservation,
  ReservationHistory,
  AbsenceCounter,
  CreateReservationRequest
} from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  parkingSpaces: ParkingSpace[] = [];
  availableSpaces: ParkingSpace[] = [];
  activeReservation: ActiveReservation | null = null;
  reservationHistory: ReservationHistory[] = [];
  absenceCounter: AbsenceCounter | null = null;

  // UI State
  showReservationModal = false;
  loadingHistory = false;
  loadingAbsence = false;

  // User Info
  userInitials = 'ES';

  // Stats
  totalReservations = 0;
  completedSessions = 0;
  totalTime = '0h';

  constructor(
    private reservationService: ReservationService,
    private parkingSpaceService: ParkingSpaceService,
    private absenceService: AbsenceService,
    private iotService: IoTSimulationService,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();

    // Refresh data every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loadParkingSpaces();
    this.loadActiveReservation();
    this.loadReservationHistory();
    this.loadAbsenceCounter();
  }

  loadParkingSpaces(): void {
    this.parkingSpaceService.getAllSpaces().subscribe({
      next: (spaces) => {
        this.parkingSpaces = spaces;
        this.availableSpaces = spaces.filter(s => s.status === 'available');
      },
      error: (error) => console.error('Error loading parking spaces:', error)
    });
  }

  loadActiveReservation(): void {
    this.reservationService.getActiveReservation().subscribe({
      next: (reservation) => {
        if (reservation) {
          // Normalizar fechas del objeto de reserva activa/sesión
          this.activeReservation = {
            ...reservation,
            startTime: this.parseDate(reservation.startTime)
          };
        } else {
          this.activeReservation = null;
        }
      },
      error: (error) => {
        // No active reservation is normal
        this.activeReservation = null;
      }
    });
  }

  loadReservationHistory(): void {
    this.loadingHistory = true;
    this.reservationService.getReservationHistory().subscribe({
      next: (history) => {
        // Normalizar y ordenar antes de mostrar 
        this.reservationHistory = history.map(h => ({
          ...h,
          startTime: this.parseDate(h.startTime),
          endTime: h.endTime ? this.parseDate(h.endTime) : undefined,
          date: h.date ? this.parseDate(h.date) : this.parseDate(h.startTime)
        })).sort((a, b) => {
          // Sort by startTime descending
          const timeA = (a.startTime as Date).getTime();
          const timeB = (b.startTime as Date).getTime();
          return timeB - timeA;
        });

        this.calculateStats(this.reservationHistory);
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.loadingHistory = false;
      }
    });
  }

  loadAbsenceCounter(): void {
    this.loadingAbsence = true;
    this.absenceService.getAbsenceCounter().subscribe({
      next: (counter) => {
        this.absenceCounter = counter;
        this.loadingAbsence = false;
      },
      error: (error) => {
        console.error('Error loading absence counter:', error);
        this.loadingAbsence = false;
      }
    });
  }

  calculateStats(history: ReservationHistory[]): void {
    this.totalReservations = history.length;
    this.completedSessions = history.filter(h => h.status === 'completed').length;

    // Calculate total time
    const totalMinutes = history
      .filter(h => h.status === 'completed' && h.startTime && h.endTime)
      .reduce((acc, h) => {
        const start = new Date(h.startTime).getTime();
        const end = new Date(h.endTime!).getTime();
        return acc + (end - start) / (1000 * 60);
      }, 0);

    const hours = Math.floor(totalMinutes / 60);
    this.totalTime = `${hours}h`;
  }

  openReservationModal(): void {
    this.showReservationModal = true;
  }

  closeReservationModal(): void {
    this.showReservationModal = false;
  }

  handleCreateReservation(request: CreateReservationRequest): void {
    // Recuperar userId del localStorage si no viene en el request
    if (!request.userId || request.userId === '') {
      let userIdCandidates = [
        localStorage.getItem('userId'),
        this.authenticationService.currentUserIdValue
      ];

      const foundId = userIdCandidates.find(id => id && id.trim() !== '');

      if (foundId) {
        request.userId = foundId;
        console.log('User ID recuperado:', request.userId);

        // Ensure it's in localStorage for next time if it wasn't
        if (!localStorage.getItem('userId')) {
          localStorage.setItem('userId', foundId);
        }
      } else {
        console.error('No se encontró User ID en localStorage ni en AuthService');
        // Final attempt: try decode token manually if service failed (unlikely but safe)
        const token = sessionStorage.getItem('token');
        if (token) {
          console.log('Intentando decodificar token manualmente como último recurso...');
          // We won't implement manual decode here to avoid import bloat, 
          // but alerting the user to re-login is the correct path.
        }

        alert('Error: Sesión no válida. Por favor recarga la página o intenta hacer login nuevamente.');
        return;
      }
    }


    // DEBUG: Log the payload to debug 400 Bad Request
    console.log('PAYLOAD SENDING TO BACKEND:', JSON.stringify(request, null, 2));

    this.reservationService.createReservation(request).subscribe({
      next: (reservation) => {
        this.closeReservationModal();
        this.loadDashboardData();
        // Show success message
        alert('¡Reserva creada exitosamente!');
      },
      error: (error) => {
        console.error('Error creating reservation:', error);
        alert('Error al crear la reserva. Por favor intenta de nuevo.');
      }
    });
  }

  handleCancelReservation(reservationId: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      this.reservationService.cancelReservation(reservationId, { reason: 'Cancelado por el usuario' }).subscribe({
        next: () => {
          this.loadDashboardData();
          alert('Reserva cancelada exitosamente');
        },
        error: (error) => {
          console.error('Error canceling reservation:', error);
          alert('Error al cancelar la reserva');
        }
      });
    }
  }

  handleSimulateArrival(spaceCode: string): void {
    this.iotService.simulateArrival(spaceCode).subscribe({
      next: () => {
        this.loadDashboardData();
        alert('¡Llegada simulada! Tu sesión ha comenzado.');
      },
      error: (error) => {
        console.error('Error simulating arrival:', error);
        alert('Error al simular llegada');
      }
    });
  }

  handleSimulateDeparture(spaceCode: string): void {
    this.iotService.simulateDeparture(spaceCode).subscribe({
      next: (response) => {
        this.loadDashboardData();
        alert(`¡Sesión completada! Duración: ${response.duration}`);
      },
      error: (error) => {
        console.error('Error simulating departure:', error);
        alert('Error al simular salida');
      }
    });
  }

  private parseDate(dateStr: string | Date | undefined | null): Date {
    if (!dateStr) return new Date(0);
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
      return isNaN(fallback.getTime()) ? new Date(0) : fallback;
    }
    return d;
  }
}
