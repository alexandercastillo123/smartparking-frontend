import { Component, Input } from '@angular/core';
import { ReservationHistory } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.scss']
})
export class SessionHistoryComponent {
  @Input() history: ReservationHistory[] = [];
  @Input() loading = false;

  private parseDate(dateStr: string | Date): number {
    if (!dateStr) return 0;
    let str = dateStr.toString();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  getDisplayedSessions(): ReservationHistory[] {
    return [...this.history]
      .sort((a, b) => this.parseDate(b.startTime) - this.parseDate(a.startTime))
      .slice(0, 2);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'expired': 'Expirada',
      'active': 'Activa',
      'confirmed': 'Confirmada',
      'pending': 'Pendiente'
    };
    return labels[status] || status;
  }

  calculateDuration(session: ReservationHistory): string | null {
    if (!session.startTime || !session.endTime) return null;

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
