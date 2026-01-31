import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../dashboard/services/reservation.service';
import { ActiveReservationCardComponent } from '../../../dashboard/components/active-reservation-card/active-reservation-card.component';
import { ActiveSessionCardComponent } from '../../../dashboard/components/active-session-card/active-session-card.component';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-reservation-history',
  standalone: true,
  imports: [
    CommonModule,
    ActiveReservationCardComponent,
    ActiveSessionCardComponent,
    ButtonComponent
  ],
  templateUrl: './reservation-history.component.html',
  styleUrl: './reservation-history.component.scss'
})
export class ReservationHistoryComponent implements OnInit {
  reservations: any[] = [];
  currentPage = 1;
  itemsPerPage = 7;
  totalPages = 0;
  pages: number[] = [];
  isLoading = true;

  // New signals from service
  hasActiveReservation = this.reservationService.hasActiveReservation;
  activeReservation = this.reservationService.activeReservation;
  hasActiveSession = this.reservationService.hasActiveSession;
  activeSession = this.reservationService.activeSession;

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.refreshData(); // Refresh to get active res
    this.loadReservations();
  }

  private parseDate(dateStr: string | Date): Date {
    if (!dateStr) return new Date(0);
    if (dateStr instanceof Date) return dateStr;
    let str = dateStr.toString();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    // Si no tiene indicador de zona horaria y parece ser una fecha completa, asumimos UTC agregando Z
    if (!str.endsWith('Z') && !str.includes('+') && str.length > 10) {
      str += 'Z';
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  loadReservations(): void {
    this.isLoading = true;
    this.reservationService.getHistory().subscribe({
      next: (records) => {
        // Mapear y ordenar de más reciente a más antiguo (descendente)
        this.reservations = records.map((res: any) => {
          const startTime = this.parseDate(res.startTime);
          // Si es cancelada y no tiene date pipe, intentamos usar la fecha local
          return {
            ...res,
            startTime: startTime,
            endTime: res.endTime ? this.parseDate(res.endTime) : undefined,
            date: res.date ? this.parseDate(res.date) : startTime,
            completedAt: res.completedAt ? this.parseDate(res.completedAt) : undefined,
            cancelledAt: res.cancelledAt ? this.parseDate(res.cancelledAt) : undefined,
          };
        }).sort((a: any, b: any) => {
          const timeA = (a.startTime as Date).getTime();
          const timeB = (b.startTime as Date).getTime();
          return timeB - timeA; // Descendente: más reciente (más grande) primero
        });
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading reservations:', error);
        this.isLoading = false;
      }
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.reservations.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedReservations(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.reservations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  get visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages + 2) {
      return this.pages;
    }

    pages.push(1);

    if (this.currentPage > 3) {
      pages.push('...');
    }

    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) {
      pages.push(i);
    }

    if (this.currentPage < this.totalPages - 2) {
      pages.push('...');
    }

    if (this.totalPages > 1) {
      pages.push(this.totalPages);
    }

    return pages;
  }

  calculateDuration(session: any): string {
    if (!session.startTime || !session.endTime) return '-';

    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const minutes = Math.floor((end - start) / (1000 * 60));

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}
