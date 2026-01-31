import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject, takeUntil } from 'rxjs';
import { ActiveReservation } from '../../../../shared/models/parking.models';

@Component({
  selector: 'app-active-session',
  templateUrl: './active-session.component.html',
  styleUrls: ['./active-session.component.scss']
})
export class ActiveSessionComponent implements OnInit, OnDestroy {
  @Input() reservation!: ActiveReservation;
  @Output() onSimulateDeparture = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  sessionSeconds = 0;

  ngOnInit(): void {
    this.updateSessionTime();

    // Update every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSessionTime();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateSessionTime(): void {
    const now = new Date().getTime();
    let startTimeValue: number;

    if (this.reservation.startTime instanceof Date) {
      startTimeValue = this.reservation.startTime.getTime();
    } else {
      let startTimeStr = String(this.reservation.startTime);
      if (startTimeStr && !startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
        startTimeStr = startTimeStr.replace(' ', 'T') + 'Z';
      }
      startTimeValue = new Date(startTimeStr).getTime();
    }

    const diff = Math.max(0, now - startTimeValue);
    this.sessionSeconds = Math.floor(diff / 1000);
  }

  formatSessionTime(): string {
    const hours = Math.floor(this.sessionSeconds / 3600);
    const minutes = Math.floor((this.sessionSeconds % 3600) / 60);
    const seconds = this.sessionSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
