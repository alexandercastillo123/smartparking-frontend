import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpaceCardComponent, SpaceCardData } from '../../components/space-card/space-card.component';
import { HistoryTableComponent } from '../../components/history-table/history-table.component';
import { NewReserveCardComponent } from '../../components/new-reserve-card/new-reserve-card.component';
import { StateAbsencesCardComponent } from '../../components/state-absences-card/state-absences-card.component';
import { ReserveModalComponent } from '../../components/reserve-modal/reserve-modal.component';
import { ActiveReservationCardComponent } from '../../components/active-reservation-card/active-reservation-card.component';
import { ActiveSessionCardComponent } from '../../components/active-session-card/active-session-card.component';
import { ReservationService } from '../../services/reservation.service';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';
import { TestControlsComponent } from '../../components/test-controls/test-controls.component';


@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    SpaceCardComponent,
    HistoryTableComponent,
    NewReserveCardComponent,
    StateAbsencesCardComponent,
    ReserveModalComponent,
    ActiveReservationCardComponent,
    ActiveSessionCardComponent,
    TestControlsComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPageComponent implements OnInit {
  // Signals del servicio
  parkingSpaces = this.reservationService.parkingSpaces;
  hasActiveReservation = this.reservationService.hasActiveReservation;
  hasActiveSession = this.reservationService.hasActiveSession;

  // Control del modal
  showReserveModal = false;

  // Número actual de ausencias (mock)
  currentAbsences: number = 0;

  // Control de si el usuario puede reservar (basado en ausencias y reserva activa)
  canUserMakeNewReservation = computed(() => {
    return !this.hasActiveReservation() && !this.hasActiveSession() && this.canReserve;
  });

  private canReserve: boolean = true;

  constructor(
    private reservationService: ReservationService,
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.reservationService.refreshData(); // Asegurar datos frescos al entrar
    this.loadDashboardData();
  }

  /**
   * Carga los datos del dashboard desde el backend
   */
  loadDashboardData(): void {
    this.dashboardService.getUserDashboard().subscribe({
      next: (response) => {
        console.log('✅ Dashboard data loaded:', response);
        this.currentAbsences = response.absenceCount;
        this.canReserve = response.canReserve;

        if (!response.canReserve) {
          console.warn('⚠️ Usuario con restricción de reserva por ausencias');
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading dashboard:', error);
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Convertir ParkingSpace a SpaceCardData para el componente
  getSpaceCardData(): SpaceCardData[] {
    return this.parkingSpaces().map(space => ({
      id: space.spaceId,
      name: `Espacio ${space.code}`,
      status: space.status
    }));
  }

  // Abrir modal de reserva
  openReserveModal(): void {
    // REGLA DE ORO: Una sola reserva activa
    if (this.hasActiveReservation() || this.hasActiveSession()) {
      alert('Ya tienes un proceso de reserva o sesión activo. Debes terminarlo antes de crear uno nuevo.');
      return;
    }

    if (!this.canReserve) {
      alert('⚠️ No puedes crear nuevas reservas debido a ausencias acumuladas.');
      return;
    }

    this.showReserveModal = true;
  }

  // Cerrar modal de reserva
  closeReserveModal(): void {
    this.showReserveModal = false;
  }

  // Manejar creación exitosa de reserva
  onReservationCreated(): void {
    this.showReserveModal = false;
    console.log('✅ Reserva creada exitosamente');
    this.reservationService.refreshData(); // Sincronizar signals inmediatamente
    this.loadDashboardData();
  }

  // Navegar a historial completo
  onViewAllHistory(): void {
    this.router.navigate(['/history']);
  }

  // Manejar click en registro del historial
  onHistoryRecordClick(record: any): void {
    console.log('📋 Registro clickeado:', record);
    // Aquí podrías abrir un modal con detalles
  }
}
