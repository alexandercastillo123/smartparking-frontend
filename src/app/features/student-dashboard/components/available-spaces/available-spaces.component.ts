import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ParkingSpace } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-available-spaces',
  templateUrl: './available-spaces.component.html',
  styleUrls: ['./available-spaces.component.scss']
})
export class AvailableSpacesComponent {
  @Input() spaces: ParkingSpace[] = [];
  @Input() hasActiveReservation = false;
  @Output() onReserve = new EventEmitter<void>();

  selectedFilter: 'all' | 'available' | 'reserved' | 'occupied' | 'maintenance' = 'all';

  get filteredSpaces(): ParkingSpace[] {
    if (this.selectedFilter === 'all') {
      return this.spaces;
    }
    return this.spaces.filter(s => s.status === this.selectedFilter);
  }

  get availableCount(): number {
    return this.spaces.filter(s => s.status === 'available').length;
  }

  get reservedCount(): number {
    return this.spaces.filter(s => s.status === 'reserved').length;
  }

  get occupiedCount(): number {
    return this.spaces.filter(s => s.status === 'occupied').length;
  }

  get maintenanceCount(): number {
    return this.spaces.filter(s => s.status === 'maintenance').length;
  }

  get totalCount(): number {
    return this.spaces.length;
  }

  setFilter(filter: 'all' | 'available' | 'reserved' | 'occupied' | 'maintenance'): void {
    this.selectedFilter = filter;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'available': 'Disponible',
      'reserved': 'Reservado',
      'occupied': 'Ocupado',
      'maintenance': 'Mantenimiento'
    };
    return labels[status] || status;
  }
}
