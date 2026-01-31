import { Component, Input } from '@angular/core';
import { AbsenceCounter } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-absence-counter',
  templateUrl: './absence-counter.component.html',
  styleUrls: ['./absence-counter.component.scss']
})
export class AbsenceCounterComponent {
  @Input() counter: AbsenceCounter | null = null;
  @Input() loading = false;

  getStatusBadge(): string {
    if (!this.counter) return '';

    const badges: Record<string, string> = {
      'safe': '✓ Sin problemas',
      'warning': '⚠ Advertencia',
      'danger': '⚠ Peligro',
      'suspended': '🚫 Suspendido'
    };

    return badges[this.counter.status] || this.counter.status;
  }
}
